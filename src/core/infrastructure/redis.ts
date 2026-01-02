import { createClient, RedisClientType } from 'redis';
import { config } from '@core/config';
import { Logger } from './logger';

const logger = new Logger('Redis');

export class RedisClient {
  private static instance: RedisClientType;

  static getInstance(): RedisClientType {
    if (!RedisClient.instance) {
      RedisClient.instance = createClient({
        socket: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
        },
        password: config.REDIS_PASSWORD,
        database: config.REDIS_DB,
      });

      RedisClient.instance.on('error', (error) => {
        logger.error('Redis client error', { error });
      });

      RedisClient.instance.on('connect', () => {
        logger.info('Redis client connected');
      });

      RedisClient.instance.on('ready', () => {
        logger.info('Redis client ready');
      });

      RedisClient.instance.on('end', () => {
        logger.info('Redis client disconnected');
      });
    }

    return RedisClient.instance;
  }

  static async connect(): Promise<void> {
    try {
      const client = RedisClient.getInstance();
      if (!client.isOpen) {
        await client.connect();
        logger.info('Redis connection established');
      }
    } catch (error) {
      logger.error('Unable to connect to Redis', { error });
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    try {
      const client = RedisClient.getInstance();
      if (client.isOpen) {
        await client.quit();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis connection', { error });
      throw error;
    }
  }

  static async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = RedisClient.getInstance();
    if (ttl) {
      await client.setEx(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  }

  static async get(key: string): Promise<string | null> {
    const client = RedisClient.getInstance();
    return client.get(key);
  }

  static async del(key: string): Promise<void> {
    const client = RedisClient.getInstance();
    await client.del(key);
  }

  static async exists(key: string): Promise<boolean> {
    const client = RedisClient.getInstance();
    const result = await client.exists(key);
    return result === 1;
  }
}

export const redis = RedisClient.getInstance();