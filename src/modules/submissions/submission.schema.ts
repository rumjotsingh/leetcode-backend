import { z } from 'zod';
import { LANGUAGES, SUBMISSION_STATUS, PAGINATION } from '../../config/constants';

export const codeSubmissionSchema = z.object({
  problemId: z.string().min(1).max(200),
  code: z.string().min(1, 'Code is required').max(50000, 'Code exceeds maximum length'),
  language: z.literal(LANGUAGES.cpp).default(LANGUAGES.cpp),
});

export const createSubmissionSchema = codeSubmissionSchema;

export const runCodeSchema = codeSubmissionSchema;

export const submissionHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  status: z
    .enum([
      SUBMISSION_STATUS.ACCEPTED,
      SUBMISSION_STATUS.WRONG_ANSWER,
      SUBMISSION_STATUS.TIME_LIMIT,
      SUBMISSION_STATUS.ERROR,
      SUBMISSION_STATUS.PENDING,
      SUBMISSION_STATUS.RUNNING,
    ])
    .optional(),
  problemId: z.string().min(1).max(200).optional(),
});

export const submissionIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid submission ID'),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type RunCodeInput = z.infer<typeof runCodeSchema>;
export type SubmissionHistoryQuery = z.infer<typeof submissionHistoryQuerySchema>;
