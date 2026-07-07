import mongoose, { Document, Schema, Types } from 'mongoose';
import { SubmissionStatus, SUBMISSION_STATUS, Language } from '../../config/constants';

export interface ITestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  runtime?: number;
  memory?: number;
}

export interface ISubmission extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  language: Language;
  sourceCode: string;
  status: SubmissionStatus;
  runtime: number | null;
  memory: number | null;
  testResults: ITestResult[];
  createdAt: Date;
}

const testResultSchema = new Schema<ITestResult>(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    actualOutput: { type: String, default: '' },
    passed: { type: Boolean, default: false },
    runtime: { type: Number },
    memory: { type: Number },
  },
  { _id: false }
);

const submissionSchema = new Schema<ISubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    language: { type: String, required: true },
    sourceCode: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      default: SUBMISSION_STATUS.PENDING,
    },
    runtime: { type: Number, default: null },
    memory: { type: Number, default: null },
    testResults: [testResultSchema],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, problemId: 1, status: 1 });
submissionSchema.index({ problemId: 1 });

export const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
