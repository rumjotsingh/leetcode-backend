import { z } from 'zod';
import { PAGINATION } from '../../config/constants';

export const playlistListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  official: z.enum(['true', 'false']).optional(),
  mine: z.enum(['true', 'false']).optional(),
});

export const createPlaylistSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).default(''),
  isPublic: z.boolean().default(true),
  problemSlugs: z.array(z.string()).default([]),
});

export const updatePlaylistSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export const playlistProblemSchema = z.object({
  problemSlug: z.string().min(1),
});

export const playlistIdParamSchema = z.object({
  id: z.string().min(1),
});

export const playlistSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export type PlaylistListQuery = z.infer<typeof playlistListQuerySchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
