import { Types } from 'mongoose';
import { DIFFICULTIES, SUBMISSION_STATUS } from '../../config/constants';
import { User } from '../users/user.model';
import { Submission } from '../submissions/submission.model';
import { Problem } from '../problems/problem.model';
import { NotFoundError } from '../../utils/errors';

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildStreak(activeDays: Set<string>): { current: number; longest: number } {
  if (activeDays.size === 0) return { current: 0, longest: 0 };

  const sorted = [...activeDays].sort();
  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      run++;
      longest = Math.max(longest, run);
    } else if (diffDays > 1) {
      run = 1;
    }
  }

  const today = toDateKey(new Date());
  const yesterday = toDateKey(new Date(Date.now() - 86400000));
  let current = 0;

  if (activeDays.has(today) || activeDays.has(yesterday)) {
    const start = activeDays.has(today) ? today : yesterday;
    current = 1;
    let cursor = new Date(start);
    while (true) {
      cursor = new Date(cursor.getTime() - 86400000);
      const key = toDateKey(cursor);
      if (!activeDays.has(key)) break;
      current++;
    }
  }

  return { current, longest };
}

export class DashboardService {
  async getDashboard(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const [difficultyTotals, acceptedSubmissions, allSubmissions, recentSubmissions, rank] = await Promise.all([
      this.getDifficultyTotals(),
      Submission.find({ userId: user._id, status: SUBMISSION_STATUS.ACCEPTED })
        .populate('problemId', 'title slug difficulty tags')
        .sort({ createdAt: -1 })
        .lean(),
      Submission.find({ userId: user._id })
        .select('createdAt status')
        .sort({ createdAt: -1 })
        .lean(),
      Submission.find({ userId: user._id })
        .populate('problemId', 'title slug difficulty')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('status language runtime memory createdAt problemId')
        .lean(),
      this.getUserRank(user),
    ]);

    const calendar: Record<string, number> = {};
    const solveDays = new Set<string>();

    for (const sub of allSubmissions) {
      const day = toDateKey(sub.createdAt);
      calendar[day] = (calendar[day] ?? 0) + 1;
      if (sub.status === SUBMISSION_STATUS.ACCEPTED) {
        solveDays.add(day);
      }
    }

    const solvedByDifficulty = { EASY: new Set<string>(), MEDIUM: new Set<string>(), HARD: new Set<string>() };
    const recentAccepted: Array<{
      problem: { id: string; title: string; slug: string; difficulty: string; tags: string[] };
      solvedAt: Date;
    }> = [];

    for (const sub of acceptedSubmissions) {
      const problem = sub.problemId as unknown as {
        _id: Types.ObjectId;
        title: string;
        slug: string;
        difficulty: string;
        tags: string[];
      } | null;
      if (!problem) continue;

      const pid = problem._id.toString();
      const bucket = solvedByDifficulty[problem.difficulty as keyof typeof solvedByDifficulty];
      if (bucket && !bucket.has(pid)) {
        bucket.add(pid);
        if (recentAccepted.length < 5) {
          recentAccepted.push({
            problem: {
              id: pid,
              title: problem.title,
              slug: problem.slug,
              difficulty: problem.difficulty,
              tags: problem.tags ?? [],
            },
            solvedAt: sub.createdAt,
          });
        }
      }
    }

    const easySolved = solvedByDifficulty.EASY.size;
    const mediumSolved = solvedByDifficulty.MEDIUM.size;
    const hardSolved = solvedByDifficulty.HARD.size;
    const totalSolved = easySolved + mediumSolved + hardSolved;
    const streak = buildStreak(solveDays);

    return {
      profile: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        authProvider: user.authProvider,
        memberSince: user.createdAt,
      },
      stats: {
        totalSolved,
        rank,
        acceptanceRate: await this.getAcceptanceRate(user._id),
        submissionCount: await Submission.countDocuments({ userId: user._id }),
        streak,
      },
      progress: {
        easy: this.progressBlock(easySolved, difficultyTotals.EASY),
        medium: this.progressBlock(mediumSolved, difficultyTotals.MEDIUM),
        hard: this.progressBlock(hardSolved, difficultyTotals.HARD),
        overall: this.progressBlock(totalSolved, difficultyTotals.TOTAL),
      },
      recentAccepted,
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
              difficulty: (s.problemId as unknown as { difficulty: string }).difficulty,
            }
          : null,
      })),
      submissionCalendar: calendar,
      submissionCalendarDays: Object.entries(calendar)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    };
  }

  private progressBlock(solved: number, total: number) {
    return {
      solved,
      total,
      percentage: total > 0 ? Math.round((solved / total) * 1000) / 10 : 0,
    };
  }

  private async getDifficultyTotals() {
    const [easy, medium, hard] = await Promise.all([
      Problem.countDocuments({ difficulty: DIFFICULTIES.EASY }),
      Problem.countDocuments({ difficulty: DIFFICULTIES.MEDIUM }),
      Problem.countDocuments({ difficulty: DIFFICULTIES.HARD }),
    ]);
    return { EASY: easy, MEDIUM: medium, HARD: hard, TOTAL: easy + medium + hard };
  }

  private async getUserRank(user: InstanceType<typeof User>): Promise<number | null> {
    if (user.totalSolved <= 0) return null;
    const ahead = await User.countDocuments({
      $or: [
        { totalSolved: { $gt: user.totalSolved } },
        { totalSolved: user.totalSolved, createdAt: { $lt: user.createdAt } },
      ],
    });
    return ahead + 1;
  }

  private async getAcceptanceRate(userId: Types.ObjectId): Promise<number> {
    const [total, accepted] = await Promise.all([
      Submission.countDocuments({ userId }),
      Submission.countDocuments({ userId, status: SUBMISSION_STATUS.ACCEPTED }),
    ]);
    if (total === 0) return 0;
    return Math.round((accepted / total) * 1000) / 10;
  }
}

export const dashboardService = new DashboardService();
