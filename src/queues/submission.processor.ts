import { Submission } from '../modules/submissions/submission.model';
import { Problem } from '../modules/problems/problem.model';
import { userService } from '../modules/users/user.service';
import { dequeueSubmission } from '../queues/submission.queue';
import { SUBMISSION_STATUS } from '../config/constants';
import { SubmissionJob } from '../queues/submission.queue';
import { runAgainstTestCases } from '../services/execution/test-runner';

export class SubmissionProcessor {
  private running = false;

  async start(): Promise<void> {
    this.running = true;
    console.log('Submission worker started');

    while (this.running) {
      try {
        const job = await dequeueSubmission(5);
        if (job) {
          await this.processJob(job);
        }
      } catch (error) {
        console.error('Worker error:', error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  stop(): void {
    this.running = false;
    console.log('Submission worker stopping...');
  }

  private async processJob(job: SubmissionJob): Promise<void> {
    const { submissionId, userId, problemId, code } = job;

    try {
      await Submission.findByIdAndUpdate(submissionId, { status: SUBMISSION_STATUS.RUNNING });

      const problem = await Problem.findById(problemId);
      if (!problem) {
        await this.markError(submissionId, 'Problem not found');
        return;
      }

      const allTestCases =
        problem.testCases.length > 0
          ? problem.testCases
          : [...(problem.visibleTestCases ?? []), ...(problem.hiddenTestCases ?? [])];

      if (allTestCases.length === 0) {
        await this.markError(submissionId, 'No test cases configured for this problem');
        return;
      }

      const summary = await runAgainstTestCases(code, allTestCases, {
        timeLimitMs: problem.timeLimit,
        memoryLimitMb: problem.memoryLimit,
      });

      const sanitizedResults = summary.testResults.map(({ input, expectedOutput, actualOutput, passed, runtime, memory }) => ({
        input,
        expectedOutput,
        actualOutput,
        passed,
        runtime,
        memory,
      }));

      await Submission.findByIdAndUpdate(submissionId, {
        status: summary.status,
        runtime: summary.runtime,
        memory: summary.memory,
        testResults: sanitizedResults,
      });

      if (summary.status === SUBMISSION_STATUS.ACCEPTED) {
        await userService.markProblemSolved(userId, problemId);
      }

      console.log(`Submission ${submissionId} processed: ${summary.status} (${summary.passedCount}/${summary.totalCount})`);
    } catch (error) {
      console.error(`Failed to process submission ${submissionId}:`, error);
      await this.markError(submissionId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async markError(submissionId: string, message: string): Promise<void> {
    await Submission.findByIdAndUpdate(submissionId, {
      status: SUBMISSION_STATUS.ERROR,
      testResults: [{ input: '', expectedOutput: '', actualOutput: message, passed: false }],
    });
  }
}

export const submissionProcessor = new SubmissionProcessor();
