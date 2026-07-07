import { Types } from 'mongoose';
import { env } from '../../config/env';
import { REDIS_KEYS, SUBMISSION_STATUS, DIFFICULTIES } from '../../config/constants';
import { User } from './user.model';
import { Submission } from '../submissions/submission.model';
import { Problem } from '../problems/problem.model';
import { NotFoundError } from '../../utils/errors';
import { cacheGet, cacheSet, cacheDel } from '../../redis/client';

export class UserService {
  async getProfile(username: string) {
    const cacheKey = REDIS_KEYS.USER_PROFILE(username);
    const cached = await cacheGet<ReturnType<typeof this.buildProfile>>(cacheKey);
    if (cached) return cached;

    const user = await User.findOne({ username });
    if (!user) throw new NotFoundError('User not found');

    const profile = await this.buildProfile(user);
    await cacheSet(cacheKey, profile, env.CACHE_TTL_USER_PROFILE);
    return profile;
  }

  private async buildProfile(user: InstanceType<typeof User>) {
    const acceptedSubmissions = await Submission.find({
      userId: user._id,
      status: SUBMISSION_STATUS.ACCEPTED,
    })
      .populate('problemId', 'title slug difficulty')
      .sort({ createdAt: -1 })
      .lean();

    const solvedProblemIds = new Set<string>();
    const difficultyCounts = { easySolved: 0, mediumSolved: 0, hardSolved: 0 };

    for (const sub of acceptedSubmissions) {
      const problem = sub.problemId as unknown as { _id: Types.ObjectId; difficulty: string } | null;
      if (!problem) continue;
      const pid = problem._id.toString();
      if (solvedProblemIds.has(pid)) continue;
      solvedProblemIds.add(pid);

      switch (problem.difficulty) {
        case DIFFICULTIES.EASY:
          difficultyCounts.easySolved++;
          break;
        case DIFFICULTIES.MEDIUM:
          difficultyCounts.mediumSolved++;
          break;
        case DIFFICULTIES.HARD:
          difficultyCounts.hardSolved++;
          break;
      }
    }

    const recentSubmissions = await Submission.find({ userId: user._id })
      .populate('problemId', 'title slug')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('status language runtime memory createdAt problemId')
      .lean();

    return {
      username: user.username,
      avatar: user.avatar,
      totalSolved: solvedProblemIds.size,
      easySolved: difficultyCounts.easySolved,
      mediumSolved: difficultyCounts.mediumSolved,
      hardSolved: difficultyCounts.hardSolved,
      recentSubmissions: recentSubmissions.map((s) => ({
        id: s._id.toString(),
        status: s.status,
        language: s.language,
        runtime: s.runtime,
        memory: s.memory,
        createdAt: s.createdAt,
        problem: s.problemId
          ? {
              id: (s.problemId as unknown as { _id: Types.ObjectId })._id.toString(),
              title: (s.problemId as unknown as { title: string }).title,
              slug: (s.problemId as unknown as { slug: string }).slug,
            }
          : null,
      })),
    };
  }

  async markProblemSolved(userId: string, problemId: string): Promise<void> {
    const problem = await Problem.findById(problemId);
    if (!problem) return;

    const user = await User.findById(userId);
    if (!user) return;

    const alreadySolved = user.solvedProblems.some((id) => id.toString() === problemId);
    if (alreadySolved) return;

    user.solvedProblems.push(new Types.ObjectId(problemId));
    user.totalSolved = user.solvedProblems.length;
    await user.save();

    await cacheDel(REDIS_KEYS.USER_PROFILE(user.username));
  }
}

export const userService = new UserService();
