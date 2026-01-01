import Redis from 'ioredis';
import { logger, logRedisConnection } from './logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logRedisConnection(redisConfig.host, redisConfig.port);
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

export const getCache = async (key: string): Promise<any> => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis get error:', error);
    return null;
  }
};

export const setCache = async (
  key: string,
  value: any,
  ttl?: number
): Promise<void> => {
  try {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, stringValue);
    } else {
      await redis.set(key, stringValue);
    }
  } catch (error) {
    logger.error('Redis set error:', error);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error('Redis delete error:', error);
  }
};