import { z } from 'zod';
import { DIFFICULTIES, LANGUAGES, PAGINATION } from '../../config/constants';

const exampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  explanation: z.string().optional(),
});

const testCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
});

const starterCodeSchema = z.object({
  javascript: z.string().default(''),
  python: z.string().default(''),
  cpp: z.string().default(''),
  java: z.string().default(''),
});

export const createProblemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  difficulty: z.enum([DIFFICULTIES.EASY, DIFFICULTIES.MEDIUM, DIFFICULTIES.HARD]),
  tags: z.array(z.string()).default([]),
  constraints: z.string().default(''),
  examples: z.array(exampleSchema).default([]),
  starterCode: starterCodeSchema.default({}),
  testCases: z.array(testCaseSchema).min(1, 'At least one test case is required'),
});

export const updateProblemSchema = createProblemSchema.partial();

export const problemListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  difficulty: z.enum([DIFFICULTIES.EASY, DIFFICULTIES.MEDIUM, DIFFICULTIES.HARD]).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['solved', 'unsolved']).optional(),
});

export const problemIdParamSchema = z.object({
  id: z.string().min(1).max(200),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
export type ProblemListQuery = z.infer<typeof problemListQuerySchema>;

export { LANGUAGES };
