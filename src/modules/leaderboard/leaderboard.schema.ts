import { z } from 'zod';
import { PAGINATION } from '../../config/constants';

export const leaderboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
