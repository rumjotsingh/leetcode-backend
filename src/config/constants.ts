export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const DIFFICULTIES = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;

export type Difficulty = (typeof DIFFICULTIES)[keyof typeof DIFFICULTIES];

export const SUBMISSION_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  ACCEPTED: 'ACCEPTED',
  WRONG_ANSWER: 'WRONG_ANSWER',
  TIME_LIMIT: 'TIME_LIMIT',
  ERROR: 'ERROR',
} as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

export const LANGUAGES = {
  cpp: 'cpp',
} as const;

export type Language = (typeof LANGUAGES)[keyof typeof LANGUAGES];

/** Judge0 language_id — C++ (GCC 9.4.0) only */
export const CPP_LANGUAGE_ID = 54;

/** CodeBox / Judge0 API maximum memory_limit (KB) */
export const EXECUTION_MAX_MEMORY_KB = 512000;

export const LANGUAGE_IDS: Record<Language, number> = {
  cpp: CPP_LANGUAGE_ID,
};

export const DEFAULT_TAGS = [
  'Array',
  'String',
  'Hash Table',
  'Linked List',
  'Stack',
  'Queue',
  'Tree',
  'Graph',
  'Dynamic Programming',
  'Greedy',
  'Binary Search',
] as const;

export const REDIS_KEYS = {
  SUBMISSION_QUEUE: 'code_submission_queue',
  PROBLEMS_LIST: 'cache:problems:list',
  PROBLEM_DETAIL: (id: string) => `cache:problems:${id}`,
  USER_PROFILE: (username: string) => `cache:users:${username}`,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
