import { REDIS_KEYS } from '../config/constants';
import { getRedis } from '../redis/client';

export interface SubmissionJob {
  submissionId: string;
  userId: string;
  problemId: string;
  code: string;
  language: string;
}

export async function enqueueSubmission(job: SubmissionJob): Promise<void> {
  await getRedis().rpush(REDIS_KEYS.SUBMISSION_QUEUE, JSON.stringify(job));
}

export async function dequeueSubmission(timeoutSeconds = 5): Promise<SubmissionJob | null> {
  const result = await getRedis().blpop(REDIS_KEYS.SUBMISSION_QUEUE, timeoutSeconds);
  if (!result) return null;
  return JSON.parse(result[1]) as SubmissionJob;
}

export async function getQueueLength(): Promise<number> {
  return getRedis().llen(REDIS_KEYS.SUBMISSION_QUEUE);
}
