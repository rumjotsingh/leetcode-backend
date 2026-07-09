import { Router } from 'express';
import { leaderboardController } from './leaderboard.controller';
import { optionalAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { leaderboardQuerySchema } from './leaderboard.schema';

const router = Router();

router.get(
  '/',
  optionalAuth,
  validate(leaderboardQuerySchema, 'query'),
  leaderboardController.getLeaderboard.bind(leaderboardController)
);

export default router;
