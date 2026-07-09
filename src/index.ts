import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env, corsOrigins } from './config/env';
import { connectDatabase } from './database/connection';
import { connectRedis } from './redis/client';
import { seedTags } from './database/seed';
import { seedPlaylists } from './database/seed-playlists';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { globalRateLimiter } from './middlewares/rateLimit.middleware';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import problemRoutes from './modules/problems/problem.routes';
import submissionRoutes from './modules/submissions/submission.routes';
import tagRoutes from './modules/tags/tag.routes';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes';
import playlistRoutes from './modules/playlists/playlist.routes';
import discussionRoutes from './modules/discussions/discussion.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(globalRateLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'codearena-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();
  await seedTags();
  await seedPlaylists();

  app.listen(env.PORT, () => {
    console.log(`CodeArena API running on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
