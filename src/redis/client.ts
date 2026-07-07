import Redis from 'ioredis';
import { env } from '../config/env';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  if (client.status === 'ready') return;
  await client.connect();
  console.log('Redis connected');
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('Redis disconnected');
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await getRedis().get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length > 0) {
    await getRedis().del(...keys);
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const client = getRedis();
  let cursor = '0';
  do {
    const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } while (cursor !== '0');
}
