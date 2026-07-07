import { connectDatabase } from './database/connection';
import { connectRedis } from './redis/client';
import { submissionProcessor } from './queues/submission.processor';
import { recoverStaleSubmissions } from './queues/submission.recovery';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  await recoverStaleSubmissions();

  const shutdown = () => {
    submissionProcessor.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await submissionProcessor.start();
}

bootstrap().catch((err) => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});
