import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from './connection';
import { Problem } from '../modules/problems/problem.model';
import { User } from '../modules/users/user.model';
import { ROLES } from '../config/constants';

interface DatasetProblem {
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  description: string;
  constraints: string[] | string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterCode: { cpp?: string };
  visibleTestCases: Array<{ input: string; expectedOutput: string }>;
  hiddenTestCases: Array<{ input: string; expectedOutput: string }>;
  hints?: string[];
  timeLimit?: number;
  memoryLimit?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface DatasetFile {
  problems: DatasetProblem[];
}

const DATASET_PATH = path.join(__dirname, '../../data/problems-dataset.json');
const SYSTEM_ADMIN = {
  username: 'codearena_system',
  email: 'system@codearena.dev',
  password: 'SystemAdmin!2026',
};

async function getOrCreateSystemAdmin() {
  let user = await User.findOne({ email: SYSTEM_ADMIN.email });
  if (user) return user;

  const passwordHash = await bcrypt.hash(SYSTEM_ADMIN.password, 12);
  user = await User.create({
    username: SYSTEM_ADMIN.username,
    email: SYSTEM_ADMIN.email,
    passwordHash,
    role: ROLES.ADMIN,
    avatar: '',
  });
  console.log('Created system admin user for problem imports');
  return user;
}

function mapProblem(raw: DatasetProblem, createdBy: string) {
  const visibleTestCases = raw.visibleTestCases ?? [];
  const hiddenTestCases = raw.hiddenTestCases ?? [];
  const constraints = Array.isArray(raw.constraints)
    ? raw.constraints.join('\n')
    : raw.constraints;

  return {
    title: raw.title,
    slug: raw.slug,
    difficulty: raw.difficulty,
    tags: raw.tags,
    description: raw.description,
    constraints,
    examples: raw.examples,
    hints: raw.hints ?? [],
    starterCode: {
      javascript: '',
      python: '',
      cpp: raw.starterCode?.cpp ?? '',
      java: '',
    },
    visibleTestCases,
    hiddenTestCases,
    testCases: [...visibleTestCases, ...hiddenTestCases],
    timeLimit: raw.timeLimit ?? 1000,
    memoryLimit: raw.memoryLimit ?? 256,
    createdBy,
    ...(raw.createdAt ? { createdAt: new Date(raw.createdAt) } : {}),
    ...(raw.updatedAt ? { updatedAt: new Date(raw.updatedAt) } : {}),
  };
}

export async function importProblemsFromDataset(options: { replace?: boolean } = {}): Promise<void> {
  const { replace = true } = options;

  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(`Dataset not found at ${DATASET_PATH}`);
  }

  const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8')) as DatasetFile;
  if (!Array.isArray(dataset.problems) || dataset.problems.length === 0) {
    throw new Error('Dataset contains no problems');
  }

  const admin = await getOrCreateSystemAdmin();
  const createdBy = admin._id.toString();

  if (replace) {
    const deleted = await Problem.deleteMany({});
    console.log(`Removed ${deleted.deletedCount} existing problems`);
  }

  const documents = dataset.problems.map((p) => mapProblem(p, createdBy));
  const inserted = await Problem.insertMany(documents, { ordered: true });

  console.log(`Imported ${inserted.length} problems from dataset`);
  console.log(`Dataset file: ${DATASET_PATH}`);
}

if (require.main === module) {
  connectDatabase()
    .then(() => importProblemsFromDataset({ replace: true }))
    .then(() => disconnectDatabase())
    .catch(async (err) => {
      console.error('Import failed:', err);
      await disconnectDatabase().catch(() => undefined);
      process.exit(1);
    });
}
