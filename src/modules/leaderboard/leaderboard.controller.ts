import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { leaderboardService } from './leaderboard.service';
import { sendSuccess } from '../../utils/response';
import { LeaderboardQuery } from './leaderboard.schema';

export class LeaderboardController {
  async getLeaderboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await leaderboardService.getLeaderboard(
        req.query as unknown as LeaderboardQuery,
        req.user?.userId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const leaderboardController = new LeaderboardController();
