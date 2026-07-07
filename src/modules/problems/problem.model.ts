import mongoose, { Document, Schema, Types } from 'mongoose';
import { Difficulty, DIFFICULTIES } from '../../config/constants';

export interface IExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ITestCase {
  input: string;
  expectedOutput: string;
}

export interface IStarterCode {
  javascript: string;
  python: string;
  cpp: string;
  java: string;
}

export interface IProblem extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  constraints: string;
  examples: IExample[];
  starterCode: IStarterCode;
  testCases: ITestCase[];
  visibleTestCases: ITestCase[];
  hiddenTestCases: ITestCase[];
  hints: string[];
  timeLimit: number;
  memoryLimit: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const exampleSchema = new Schema<IExample>(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String },
  },
  { _id: false }
);

const testCaseSchema = new Schema<ITestCase>(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
  },
  { _id: false }
);

const starterCodeSchema = new Schema<IStarterCode>(
  {
    javascript: { type: String, default: '' },
    python: { type: String, default: '' },
    cpp: { type: String, default: '' },
    java: { type: String, default: '' },
  },
  { _id: false }
);

const problemSchema = new Schema<IProblem>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: Object.values(DIFFICULTIES), required: true },
    tags: [{ type: String, trim: true }],
    constraints: { type: String, default: '' },
    examples: [exampleSchema],
    starterCode: { type: starterCodeSchema, default: () => ({}) },
    testCases: [testCaseSchema],
    visibleTestCases: [testCaseSchema],
    hiddenTestCases: [testCaseSchema],
    timeLimit: { type: Number, default: 1000 },
    memoryLimit: { type: Number, default: 256 },
    hints: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

problemSchema.index({ difficulty: 1 });
problemSchema.index({ tags: 1 });
problemSchema.index({ title: 'text', description: 'text' });

export const Problem = mongoose.model<IProblem>('Problem', problemSchema);
