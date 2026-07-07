import { Types } from 'mongoose';
import { Submission } from './submission.model';
import { CreateSubmissionInput, RunCodeInput, SubmissionHistoryQuery } from './submission.schema';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { enqueueSubmission } from '../../queues/submission.queue';
import { SUBMISSION_STATUS, LANGUAGES } from '../../config/constants';
import { getPagination } from '../../utils/response';
import { findProblemByIdOrSlug } from '../../utils/problemLookup';
import { runAgainstTestCases } from '../../services/execution/test-runner';

export class SubmissionService {
  /**
   * Run code against visible (public) test cases only — synchronous, no DB record.
   * For the Monaco editor "Run" button.
   */
  async run(input: RunCodeInput) {
    const problem = await findProblemByIdOrSlug(input.problemId);
    if (!problem) throw new NotFoundError('Problem not found');

    const testCases = problem.visibleTestCases?.length
      ? problem.visibleTestCases
      : problem.testCases.slice(0, 3);

    const summary = await runAgainstTestCases(input.code, testCases, {
      timeLimitMs: problem.timeLimit,
      memoryLimitMb: problem.memoryLimit,
      markPublic: true,
    });

    return {
      mode: 'run',
      language: LANGUAGES.cpp,
      languageId: 54,
      status: summary.status,
      passedCount: summary.passedCount,
      totalCount: summary.totalCount,
      runtime: summary.runtime,
      memory: summary.memory,
      testResults: summary.testResults,
    };
  }

  /**
   * Submit code — queued for async judging against ALL test cases (visible + hidden).
   */
  async create(input: CreateSubmissionInput, userId: string) {
    const problem = await findProblemByIdOrSlug(input.problemId);
    if (!problem) throw new NotFoundError('Problem not found');

    const submission = await Submission.create({
      userId: new Types.ObjectId(userId),
      problemId: problem._id,
      language: LANGUAGES.cpp,
      sourceCode: input.code,
      status: SUBMISSION_STATUS.PENDING,
    });

    await enqueueSubmission({
      submissionId: submission._id.toString(),
      userId,
      problemId: problem._id.toString(),
      code: input.code,
      language: LANGUAGES.cpp,
    });

    return {
      id: submission._id.toString(),
      status: submission.status,
      language: LANGUAGES.cpp,
      languageId: 54,
      createdAt: submission.createdAt,
      message:
        'Submission queued for judging. Poll GET /api/submissions/:id every 2–3 seconds until status is no longer PENDING or RUNNING.',
    };
  }

  async getById(id: string, userId: string, isAdmin = false) {
    const submission = await Submission.findById(id)
      .populate('problemId', 'title slug difficulty')
      .lean();

    if (!submission) throw new NotFoundError('Submission not found');

    if (!isAdmin && submission.userId.toString() !== userId) {
      throw new ForbiddenError('You can only view your own submissions');
    }

    return this.formatSubmission(submission);
  }

  async getHistory(userId: string, query: SubmissionHistoryQuery) {
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

    if (query.status) filter.status = query.status;
    if (query.problemId) {
      const problem = await findProblemByIdOrSlug(query.problemId);
      if (problem) filter.problemId = problem._id;
    }

    const skip = (query.page - 1) * query.limit;
    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('problemId', 'title slug difficulty')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Submission.countDocuments(filter),
    ]);

    return {
      submissions: submissions.map((s) => this.formatSubmission(s)),
      pagination: getPagination(query.page, query.limit, total),
    };
  }

  private formatSubmission(submission: Record<string, unknown>) {
    const problem = submission.problemId as Record<string, unknown> | null;
    return {
      id: (submission._id as Types.ObjectId).toString(),
      status: submission.status,
      language: submission.language,
      sourceCode: submission.sourceCode,
      runtime: submission.runtime,
      memory: submission.memory,
      testResults: submission.testResults,
      createdAt: submission.createdAt,
      problem: problem
        ? {
            id: (problem._id as Types.ObjectId).toString(),
            title: problem.title,
            slug: problem.slug,
            difficulty: problem.difficulty,
          }
        : null,
    };
  }
}

export const submissionService = new SubmissionService();
