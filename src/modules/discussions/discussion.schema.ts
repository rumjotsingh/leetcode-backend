import { z } from 'zod';
import { PAGINATION } from '../../config/constants';

export const discussionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export const createDiscussionSchema = z.object({
  problemSlug: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
});

export const createReplySchema = z.object({
  content: z.string().min(1).max(5000),
});

export const updateDiscussionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
});

export const discussionIdParamSchema = z.object({
  id: z.string().min(1),
});

export const problemDiscussionsParamSchema = z.object({
  problemSlug: z.string().min(1),
});

export type DiscussionListQuery = z.infer<typeof discussionListQuerySchema>;
export type CreateDiscussionInput = z.infer<typeof createDiscussionSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type UpdateDiscussionInput = z.infer<typeof updateDiscussionSchema>;
