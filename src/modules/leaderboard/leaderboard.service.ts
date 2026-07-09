import { Types } from 'mongoose';
import { SUBMISSION_STATUS, DIFFICULTIES } from '../../config/constants';
import { User } from '../users/user.model';
import { Submission } from '../submissions/submission.model';
import { getPagination } from '../../utils/response';
import { LeaderboardQuery } from './leaderboard.schema';

export class LeaderboardService {
  async getLeaderboard(query: LeaderboardQuery, currentUserId?: string) {
    const skip = (query.page - 1) * query.limit;

    const users = await User.find({ totalSolved: { $gt: 0 } })
      .sort({ totalSolved: -1, createdAt: 1 })
      .skip(skip)
      .limit(query.limit)
      .select('username avatar totalSolved createdAt')
      .lean();

    const total = await User.countDocuments({ totalSolved: { $gt: 0 } });

    const userIds = users.map((u) => u._id);
    const accepted = await Submission.find({
      userId: { $in: userIds },
      status: SUBMISSION_STATUS.ACCEPTED,
    })
      .populate('problemId', 'difficulty')
      .lean();

    const statsMap = new Map<string, { easy: number; medium: number; hard: number; solved: Set<string> }>();
    for (const id of userIds) {
      statsMap.set(id.toString(), { easy: 0, medium: 0, hard: 0, solved: new Set() });
    }

    for (const sub of accepted) {
      const uid = sub.userId.toString();
      const bucket = statsMap.get(uid);
      const problem = sub.problemId as unknown as { _id: Types.ObjectId; difficulty: string } | null;
      if (!bucket || !problem) continue;
      const pid = problem._id.toString();
      if (bucket.solved.has(pid)) continue;
      bucket.solved.add(pid);
      switch (problem.difficulty) {
        case DIFFICULTIES.EASY:
          bucket.easy++;
          break;
        case DIFFICULTIES.MEDIUM:
          bucket.medium++;
          break;
        case DIFFICULTIES.HARD:
          bucket.hard++;
          break;
      }
    }

    const entries = users.map((user, index) => {
      const stats = statsMap.get(user._id.toString());
      return {
        rank: skip + index + 1,
        username: user.username,
        avatar: user.avatar,
        totalSolved: user.totalSolved,
        easySolved: stats?.easy ?? 0,
        mediumSolved: stats?.medium ?? 0,
        hardSolved: stats?.hard ?? 0,
        isCurrentUser: currentUserId === user._id.toString(),
      };
    });

    let myRank: number | null = null;
    if (currentUserId) {
      const me = await User.findById(currentUserId).select('totalSolved createdAt').lean();
      if (me && me.totalSolved > 0) {
        const ahead = await User.countDocuments({
          $or: [
            { totalSolved: { $gt: me.totalSolved } },
            { totalSolved: me.totalSolved, createdAt: { $lt: me.createdAt } },
          ],
        });
        myRank = ahead + 1;
      }
    }

    return {
      leaderboard: entries,
      myRank,
      pagination: getPagination(query.page, query.limit, total),
    };
  }
}

export const leaderboardService = new LeaderboardService();
