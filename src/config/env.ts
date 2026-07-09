import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  EXECUTION_API_URL: z.string().url().default('https://api.rumjot.me'),
  EXECUTION_API_TOKEN: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  CACHE_TTL_PROBLEMS: z.coerce.number().default(300),
  CACHE_TTL_PROBLEM_DETAIL: z.coerce.number().default(600),
  CACHE_TTL_USER_PROFILE: z.coerce.number().default(300),
  GOOGLE_CLIENT_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
