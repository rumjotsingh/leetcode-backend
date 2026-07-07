import { executionService } from './execution.service';
import { buildBatchProgram, parseBatchOutput } from './batch-runner';
import { SUBMISSION_STATUS, SubmissionStatus, EXECUTION_MAX_MEMORY_KB } from '../../config/constants';
import { ITestCase } from '../../modules/problems/problem.model';

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  runtime: number;
  memory: number;
  status: string;
  statusId?: number;
  isPublic: boolean;
}

export interface RunSummary {
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  runtime: number | null;
  memory: number | null;
  testResults: TestCaseResult[];
}

function toLimits(timeLimitMs: number, memoryLimitMb: number, testCount: number) {
  const perCaseSec = timeLimitMs / 1000;
  // Judge0/CodeBox caps: cpu_time_limit ≤ 15s, wall_time_limit ≤ 20s
  const cpuTimeLimitSec = Math.min(15, perCaseSec * Math.max(testCount, 1));
  return {
    cpuTimeLimitSec,
    memoryLimitKb: Math.min(Math.round(memoryLimitMb * 1024), EXECUTION_MAX_MEMORY_KB),
  };
}

function mapFailureStatus(statusId?: number): SubmissionStatus {
  if (statusId === undefined) return SUBMISSION_STATUS.ERROR;
  const mapped = executionService.mapStatusToSubmission(statusId, false);
  if (mapped === SUBMISSION_STATUS.ACCEPTED) return SUBMISSION_STATUS.WRONG_ANSWER;
  return mapped;
}

function buildFailureResults(
  testCases: ITestCase[],
  actualOutput: string,
  status: string,
  statusId: number | undefined,
  markPublic: boolean
): TestCaseResult[] {
  return testCases.map((testCase) => ({
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput,
    passed: false,
    runtime: 0,
    memory: 0,
    status,
    statusId,
    isPublic: markPublic,
  }));
}

function summarize(testResults: TestCaseResult[]): RunSummary {
  let passedCount = 0;
  let totalRuntime = 0;
  let maxMemory = 0;
  let firstFailure: SubmissionStatus | null = null;

  for (const res of testResults) {
    totalRuntime += res.runtime;
    maxMemory = Math.max(maxMemory, res.memory);
    if (res.passed) {
      passedCount++;
      continue;
    }
    if (firstFailure === null) {
      firstFailure = mapFailureStatus(res.statusId);
    }
  }

  const finalStatus =
    passedCount === testResults.length
      ? SUBMISSION_STATUS.ACCEPTED
      : firstFailure ?? SUBMISSION_STATUS.WRONG_ANSWER;

  return {
    status: finalStatus,
    passedCount,
    totalCount: testResults.length,
    runtime: testResults.length > 0 ? totalRuntime / testResults.length : null,
    memory: maxMemory || null,
    testResults,
  };
}

/**
 * Run all test cases in a single CodeBox submission (one compile).
 * Falls back to sequential per-test execution only if user code has no int main().
 */
async function runBatch(
  sourceCode: string,
  testCases: ITestCase[],
  limits: { cpuTimeLimitSec: number; memoryLimitKb: number },
  markPublic: boolean
): Promise<RunSummary | null> {
  const batchProgram = buildBatchProgram(sourceCode, testCases);
  if (!batchProgram) return null;

  let result;
  try {
    result = await executionService.executeAndJudge(batchProgram, limits);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Execution service error';
    return summarize(buildFailureResults(testCases, message, 'Execution Error', undefined, markPublic));
  }

  const statusId = result.status.id;
  const runtime = result.time ? parseFloat(result.time) * 1000 : 0;
  const memory = result.memory ?? 0;

  if (!executionService.isJudgingSuccess(statusId) && statusId !== 4) {
    const actualOutput = executionService.getActualOutput(result);
    return summarize(
      buildFailureResults(testCases, actualOutput, result.status.description, statusId, markPublic)
    );
  }

  const parsed = parseBatchOutput(result.stdout);
  const perTestRuntime = testCases.length > 0 ? runtime / testCases.length : runtime;

  const testResults: TestCaseResult[] = testCases.map((testCase, index) => {
    const line = parsed.find((p) => p.index === index);
    const expected = executionService.normalizeOutput(testCase.expectedOutput);
    const actualOutput = line ? executionService.normalizeOutput(line.actualOutput) : '';
    const passed = line ? line.passed && actualOutput === expected : false;

    return {
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: line ? line.actualOutput : executionService.getActualOutput(result),
      passed,
      runtime: perTestRuntime,
      memory,
      status: passed ? 'Accepted' : line ? 'Wrong Answer' : result.status.description,
      statusId: passed ? 3 : line ? 4 : statusId,
      isPublic: markPublic,
    };
  });

  return summarize(testResults);
}

/** Fallback: one API call per test case (slow — recompiles each time). */
async function runSequential(
  sourceCode: string,
  testCases: ITestCase[],
  limits: { cpuTimeLimitSec: number; memoryLimitKb: number },
  markPublic: boolean
): Promise<RunSummary> {
  const perCaseLimits = {
    cpuTimeLimitSec: limits.cpuTimeLimitSec / Math.max(testCases.length, 1),
    memoryLimitKb: limits.memoryLimitKb,
  };

  const testResults: TestCaseResult[] = [];

  for (const testCase of testCases) {
    const expectedOutput = executionService.normalizeOutput(testCase.expectedOutput);

    let result;
    try {
      result = await executionService.executeAndJudge(sourceCode, {
        stdin: testCase.input,
        expectedOutput,
        ...perCaseLimits,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Execution service error';
      testResults.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: message,
        passed: false,
        runtime: 0,
        memory: 0,
        status: 'Execution Error',
        isPublic: markPublic,
      });
      continue;
    }

    const actualOutput = executionService.getActualOutput(result);
    const passed =
      executionService.isJudgingSuccess(result.status.id) && actualOutput === expectedOutput;

    testResults.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput,
      passed,
      runtime: result.time ? parseFloat(result.time) * 1000 : 0,
      memory: result.memory ?? 0,
      status: result.status.description,
      statusId: result.status.id,
      isPublic: markPublic,
    });
  }

  return summarize(testResults);
}

export async function runAgainstTestCases(
  sourceCode: string,
  testCases: ITestCase[],
  options: {
    timeLimitMs?: number;
    memoryLimitMb?: number;
    publicOnly?: boolean;
    markPublic?: boolean;
  } = {}
): Promise<RunSummary> {
  if (testCases.length === 0) {
    return {
      status: SUBMISSION_STATUS.ERROR,
      passedCount: 0,
      totalCount: 0,
      runtime: null,
      memory: null,
      testResults: [],
    };
  }

  const { timeLimitMs = 1000, memoryLimitMb = 256, markPublic = false } = options;
  const limits = toLimits(timeLimitMs, memoryLimitMb, testCases.length);

  const batchSummary = await runBatch(sourceCode, testCases, limits, markPublic);
  if (batchSummary) return batchSummary;

  return runSequential(sourceCode, testCases, limits, markPublic);
}
