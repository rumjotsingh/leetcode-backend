import { Types } from 'mongoose';
import slugify from 'slugify';
import { Playlist } from './playlist.model';
import { Problem } from '../problems/problem.model';
import { NotFoundError, ForbiddenError, ConflictError } from '../../utils/errors';
import { getPagination } from '../../utils/response';
import { findProblemByIdOrSlug } from '../../utils/problemLookup';
import {
  PlaylistListQuery,
  CreatePlaylistInput,
  UpdatePlaylistInput,
} from './playlist.schema';

function formatPlaylistSummary(playlist: InstanceType<typeof Playlist>, creator?: { username: string; avatar: string } | null) {
  return {
    id: playlist._id.toString(),
    title: playlist.title,
    slug: playlist.slug,
    description: playlist.description,
    isOfficial: playlist.isOfficial,
    isPublic: playlist.isPublic,
    problemCount: playlist.problems.length,
    creator: creator ?? null,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
}

export class PlaylistService {
  async list(query: PlaylistListQuery, userId?: string) {
    const filter: Record<string, unknown> = {};

    if (query.official === 'true') {
      filter.isOfficial = true;
    } else if (query.mine === 'true' && userId) {
      filter.createdBy = new Types.ObjectId(userId);
    } else {
      filter.$or = [{ isOfficial: true }, { isPublic: true }];
      if (userId) {
        (filter.$or as Record<string, unknown>[]).push({ createdBy: new Types.ObjectId(userId) });
      }
    }

    const skip = (query.page - 1) * query.limit;
    const [playlists, total] = await Promise.all([
      Playlist.find(filter).sort({ isOfficial: -1, updatedAt: -1 }).skip(skip).limit(query.limit).populate('createdBy', 'username avatar').lean(),
      Playlist.countDocuments(filter),
    ]);

    return {
      playlists: playlists.map((p) =>
        formatPlaylistSummary(p as unknown as InstanceType<typeof Playlist>, p.createdBy as { username: string; avatar: string } | null)
      ),
      pagination: getPagination(query.page, query.limit, total),
    };
  }

  async getBySlug(slug: string, userId?: string) {
    const playlist = await Playlist.findOne({ slug }).populate('createdBy', 'username avatar');
    if (!playlist) throw new NotFoundError('Playlist not found');

    if (!playlist.isPublic && !playlist.isOfficial) {
      if (!userId || playlist.createdBy?._id.toString() !== userId) {
        throw new ForbiddenError('This playlist is private');
      }
    }

    const problems = await Problem.find({ _id: { $in: playlist.problems } })
      .select('title slug difficulty tags')
      .lean();

    const problemMap = new Map(problems.map((p) => [p._id.toString(), p]));
    const orderedProblems = playlist.problems
      .map((id) => problemMap.get(id.toString()))
      .filter(Boolean)
      .map((p) => ({
        id: p!._id.toString(),
        title: p!.title,
        slug: p!.slug,
        difficulty: p!.difficulty,
        tags: p!.tags,
      }));

    const creator = playlist.createdBy as unknown as { username: string; avatar: string } | null;

    return {
      ...formatPlaylistSummary(playlist, creator),
      problems: orderedProblems,
    };
  }

  async create(userId: string, input: CreatePlaylistInput) {
    const baseSlug = slugify(input.title, { lower: true, strict: true });
    let slug = baseSlug;
    let suffix = 0;
    while (await Playlist.exists({ slug })) {
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }

    const problemIds: Types.ObjectId[] = [];
    for (const problemSlug of input.problemSlugs) {
      const problem = await findProblemByIdOrSlug(problemSlug);
      if (problem) problemIds.push(problem._id);
    }

    const playlist = await Playlist.create({
      title: input.title,
      slug,
      description: input.description,
      isOfficial: false,
      isPublic: input.isPublic,
      createdBy: new Types.ObjectId(userId),
      problems: problemIds,
    });

    return formatPlaylistSummary(playlist);
  }

  async update(playlistId: string, userId: string, input: UpdatePlaylistInput) {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new NotFoundError('Playlist not found');
    if (playlist.isOfficial) throw new ForbiddenError('Official playlists cannot be edited');
    if (playlist.createdBy?.toString() !== userId) throw new ForbiddenError('You can only edit your own playlists');

    if (input.title) playlist.title = input.title;
    if (input.description !== undefined) playlist.description = input.description;
    if (input.isPublic !== undefined) playlist.isPublic = input.isPublic;
    await playlist.save();

    return formatPlaylistSummary(playlist);
  }

  async delete(playlistId: string, userId: string) {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new NotFoundError('Playlist not found');
    if (playlist.isOfficial) throw new ForbiddenError('Official playlists cannot be deleted');
    if (playlist.createdBy?.toString() !== userId) throw new ForbiddenError('You can only delete your own playlists');
    await Playlist.deleteOne({ _id: playlist._id });
  }

  async addProblem(playlistId: string, userId: string, problemSlug: string) {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new NotFoundError('Playlist not found');
    if (playlist.createdBy?.toString() !== userId) throw new ForbiddenError('You can only edit your own playlists');

    const problem = await findProblemByIdOrSlug(problemSlug);
    if (!problem) throw new NotFoundError('Problem not found');

    const exists = playlist.problems.some((id) => id.toString() === problem._id.toString());
    if (exists) throw new ConflictError('Problem already in playlist');

    playlist.problems.push(problem._id);
    await playlist.save();
    return formatPlaylistSummary(playlist);
  }

  async removeProblem(playlistId: string, userId: string, problemSlug: string) {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new NotFoundError('Playlist not found');
    if (playlist.createdBy?.toString() !== userId) throw new ForbiddenError('You can only edit your own playlists');

    const problem = await findProblemByIdOrSlug(problemSlug);
    if (!problem) throw new NotFoundError('Problem not found');

    playlist.problems = playlist.problems.filter((id) => id.toString() !== problem._id.toString());
    await playlist.save();
    return formatPlaylistSummary(playlist);
  }
}

export const playlistService = new PlaylistService();
