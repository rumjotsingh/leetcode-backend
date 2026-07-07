import { Submission } from '../modules/submissions/submission.model';
import { SUBMISSION_STATUS } from '../config/constants';
import { enqueueSubmission } from './submission.queue';

/**
 * Re-queue submissions left PENDING/RUNNING when the worker was not running.
 * Called once on worker startup.
 */
export async function recoverStaleSubmissions(): Promise<number> {
  const stale = await Submission.find({
    status: { $in: [SUBMISSION_STATUS.PENDING, SUBMISSION_STATUS.RUNNING] },
    $or: [{ testResults: { $size: 0 } }, { testResults: { $exists: false } }],
  }).select('_id userId problemId sourceCode language status');

  if (stale.length === 0) return 0;

  for (const sub of stale) {
    if (sub.status === SUBMISSION_STATUS.RUNNING) {
      await Submission.findByIdAndUpdate(sub._id, { status: SUBMISSION_STATUS.PENDING });
    }

    await enqueueSubmission({
      submissionId: sub._id.toString(),
      userId: sub.userId.toString(),
      problemId: sub.problemId.toString(),
      code: sub.sourceCode,
      language: sub.language,
    });
  }

  console.log(`Recovered ${stale.length} stale submission(s) back into the queue`);
  return stale.length;
}
