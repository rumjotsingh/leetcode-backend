import { FilterQuery, Types } from 'mongoose';
import { env } from '../../config/env';
import { REDIS_KEYS, SUBMISSION_STATUS } from '../../config/constants';
import { Problem, IProblem } from './problem.model';
import { Submission } from '../submissions/submission.model';
import { CreateProblemInput, UpdateProblemInput, ProblemListQuery } from './problem.schema';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { generateSlug } from '../../utils/helpers';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../../redis/client';

export class ProblemService {
  async create(input: CreateProblemInput, createdBy: string) {
    const slug = generateSlug(input.title);
    const existing = await Problem.findOne({ slug });
    if (existing) {
      throw new ConflictError('A problem with a similar title already exists');
    }

    const problem = await Problem.create({
      ...input,
      slug,
      createdBy: new Types.ObjectId(createdBy),
    });

    await this.invalidateCache();
    return this.formatProblemDetail(problem);
  }

  async update(id: string, input: UpdateProblemInput) {
    const problem = await Problem.findById(id);
    if (!problem) throw new NotFoundError('Problem not found');

    if (input.title) {
      problem.slug = generateSlug(input.title);
    }

    Object.assign(problem, input);
    await problem.save();

    await this.invalidateCache(id);
    return this.formatProblemDetail(problem);
  }

  async delete(id: string): Promise<void> {
    const problem = await Problem.findByIdAndDelete(id);
    if (!problem) throw new NotFoundError('Problem not found');
    await this.invalidateCache(id);
  }

  async getById(idOrSlug: string, includeTestCases = false) {
    const cacheKey = REDIS_KEYS.PROBLEM_DETAIL(idOrSlug);
    if (!includeTestCases) {
      const cached = await cacheGet<ReturnType<typeof this.formatProblemDetail>>(cacheKey);
      if (cached) return cached;
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const problem = isObjectId
      ? await Problem.findById(idOrSlug)
      : await Problem.findOne({ slug: idOrSlug.toLowerCase() });

    if (!problem) throw new NotFoundError('Problem not found');

    const formatted = this.formatProblemDetail(problem, includeTestCases);
    if (!includeTestCases) {
      await cacheSet(cacheKey, formatted, env.CACHE_TTL_PROBLEM_DETAIL);
    }
    return formatted;
  }

  async list(query: ProblemListQuery, userId?: string) {
    const cacheKey = this.buildListCacheKey(query, userId);
    const cached = await cacheGet<{ problems: unknown[]; pagination: unknown }>(cacheKey);
    if (cached) return cached;

    const filter: FilterQuery<IProblem> = {};

    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }
    if (query.tag) {
      filter.tags = { $regex: new RegExp(query.tag, 'i') };
    }
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const skip = (query.page - 1) * query.limit;
    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .select('title slug difficulty tags')
        .lean(),
      Problem.countDocuments(filter),
    ]);

    let solvedSet = new Set<string>();
    if (userId) {
      const solved = await Submission.distinct('problemId', {
        userId: new Types.ObjectId(userId),
        status: SUBMISSION_STATUS.ACCEPTED,
      });
      solvedSet = new Set(solved.map((id) => id.toString()));
    }

    let formattedProblems = problems.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      tags: p.tags,
      solved: userId ? solvedSet.has(p._id.toString()) : false,
    }));

    if (query.status === 'solved' && userId) {
      formattedProblems = formattedProblems.filter((p) => p.solved);
    } else if (query.status === 'unsolved' && userId) {
      formattedProblems = formattedProblems.filter((p) => !p.solved);
    }

    const result = {
      problems: formattedProblems,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };

    await cacheSet(cacheKey, result, env.CACHE_TTL_PROBLEMS);
    return result;
  }

  private formatProblemDetail(problem: IProblem, includeTestCases = false) {
    const base = {
      id: problem._id.toString(),
      title: problem.title,
      slug: problem.slug,
      description: problem.description,
      difficulty: problem.difficulty,
      tags: problem.tags,
      constraints: problem.constraints,
      examples: problem.examples,
      hints: problem.hints ?? [],
      starterCode: problem.starterCode,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
    };

    if (includeTestCases) {
      return {
        ...base,
        testCases: problem.testCases,
        visibleTestCases: problem.visibleTestCases,
        hiddenTestCases: problem.hiddenTestCases,
      };
    }
    return base;
  }

  private buildListCacheKey(query: ProblemListQuery, userId?: string): string {
    const parts = [
      REDIS_KEYS.PROBLEMS_LIST,
      query.page,
      query.limit,
      query.difficulty ?? 'all',
      query.tag ?? 'all',
      query.search ?? 'all',
      query.status ?? 'all',
      userId ?? 'anon',
    ];
    return parts.join(':');
  }

  private async invalidateCache(problemId?: string): Promise<void> {
    await cacheDelPattern(`${REDIS_KEYS.PROBLEMS_LIST}*`);
    if (problemId) {
      await cacheDel(REDIS_KEYS.PROBLEM_DETAIL(problemId));
    }
  }
}

export const problemService = new ProblemService();
