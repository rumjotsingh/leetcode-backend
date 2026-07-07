import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { CPP_LANGUAGE_ID, EXECUTION_MAX_MEMORY_KB } from '../../config/constants';

export interface ExecutionResult {
  token?: string;
  status: {
    id: number;
    description: string;
  };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string | null;
  memory: number | null;
  message: string | null;
}

export interface ExecuteOptions {
  stdin?: string;
  expectedOutput?: string;
  cpuTimeLimitSec?: number;
  memoryLimitKb?: number;
}

const JUDGE0_STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR: 11,
} as const;

export class ExecutionService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.EXECUTION_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': env.EXECUTION_API_TOKEN,
      },
      timeout: 60000,
    });
  }

  /**
   * Judge0-compatible execution via POST /submissions?wait=true.
   * Uses language_id 54 (C++ GCC 9.4.0) only.
   *
   * Under concurrency the service may return before execution finishes
   * (status IN_QUEUE/PROCESSING with null stdout). In that case we poll the
   * token via GET /submissions/:token until the result is final.
   */
  async executeAndJudge(sourceCode: string, options: ExecuteOptions = {}): Promise<ExecutionResult> {
    const body: Record<string, unknown> = {
      source_code: sourceCode,
      language_id: CPP_LANGUAGE_ID,
      stdin: options.stdin ?? '',
    };

    if (options.expectedOutput !== undefined) {
      body.expected_output = options.expectedOutput;
    }
    if (options.cpuTimeLimitSec !== undefined) {
      const cpuTimeLimitSec = Math.min(15, options.cpuTimeLimitSec);
      body.cpu_time_limit = cpuTimeLimitSec;
      body.wall_time_limit = Math.min(20, Math.max(15, cpuTimeLimitSec * 2));
    }
    if (options.memoryLimitKb !== undefined) {
      body.memory_limit = Math.min(options.memoryLimitKb, EXECUTION_MAX_MEMORY_KB);
    }

    const response = await this.client.post<ExecutionResult>('/submissions', body, {
      params: { wait: true, base64_encoded: false },
    });

    let result = response.data;

    if (this.isPending(result.status?.id) && result.token) {
      result = await this.pollResult(result.token);
    }

    return result;
  }

  private isPending(statusId?: number): boolean {
    return statusId === JUDGE0_STATUS.IN_QUEUE || statusId === JUDGE0_STATUS.PROCESSING;
  }

  private async pollResult(token: string, maxAttempts = 60, intervalMs = 300): Promise<ExecutionResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const delay = Math.min(1000, intervalMs + attempt * 50);
      await new Promise((resolve) => setTimeout(resolve, delay));

      const { data } = await this.client.get<ExecutionResult>(`/submissions/${token}`, {
        params: { base64_encoded: false },
      });

      if (!this.isPending(data.status?.id)) {
        return data;
      }
    }

    throw new Error('Execution timed out waiting for result');
  }

  mapStatusToSubmission(
    statusId: number,
    outputMatches?: boolean
  ): 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT' | 'ERROR' {
    switch (statusId) {
      case JUDGE0_STATUS.ACCEPTED:
        return 'ACCEPTED';
      case JUDGE0_STATUS.WRONG_ANSWER:
        return 'WRONG_ANSWER';
      case JUDGE0_STATUS.TIME_LIMIT:
        return 'TIME_LIMIT';
      case JUDGE0_STATUS.COMPILATION_ERROR:
      case JUDGE0_STATUS.RUNTIME_ERROR:
        return 'ERROR';
      default:
        if (outputMatches === false) return 'WRONG_ANSWER';
        return 'ERROR';
    }
  }

  normalizeOutput(output: string | null): string {
    if (!output) return '';
    return output.trim().replace(/\r\n/g, '\n');
  }

  getActualOutput(result: ExecutionResult): string {
    if (result.stdout) return this.normalizeOutput(result.stdout);
    if (result.compile_output) return this.normalizeOutput(result.compile_output);
    if (result.stderr) return this.normalizeOutput(result.stderr);
    if (result.message) return result.message;
    return '';
  }

  isJudgingSuccess(statusId: number): boolean {
    return statusId === JUDGE0_STATUS.ACCEPTED;
  }
}

export const executionService = new ExecutionService();
