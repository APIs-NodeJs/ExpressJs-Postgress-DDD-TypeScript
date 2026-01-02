import { createClient, RedisClientType } from 'redis';
import { config } from '@core/config';
import { Logger } from './logger';

const logger = new Logger('Redis');

export class RedisClient {
  private static instance: RedisClientType | null = null;
  private static isConnected = false;

  static getInstance(): RedisClientType {
    if (!RedisClient.instance) {
      RedisClient.instance = createClient({
        socket: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            const delay = Math.min(retries * 100, 3000);
            logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          },
        },
        password: config.REDIS_PASSWORD,
        database: config.REDIS_DB,
      });

      RedisClient.instance.on('error', (error) => {
        logger.error('Redis client error', {
          error: error.message,
        });
        RedisClient.isConnected = false;
      });

      RedisClient.instance.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      RedisClient.instance.on('ready', () => {
        logger.info('Redis client ready');
        RedisClient.isConnected = true;
      });

      RedisClient.instance.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...');
        RedisClient.isConnected = false;
      });

      RedisClient.instance.on('end', () => {
        logger.info('Redis client disconnected');
        RedisClient.isConnected = false;
      });
    }

    return RedisClient.instance;
  }

  static async connect(): Promise<void> {
    if (RedisClient.isConnected) {
      logger.info('Redis already connected');
      return;
    }

    try {
      const client = RedisClient.getInstance();
      if (!client.isOpen) {
        await client.connect();
        RedisClient.isConnected = true;
        logger.info('Redis connection established', {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
        });
      }
    } catch (error) {
      RedisClient.isConnected = false;
      logger.error('Unable to connect to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      });
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (!RedisClient.instance || !RedisClient.isConnected) {
      logger.info('Redis not connected, skipping disconnect');
      return;
    }

    try {
      const client = RedisClient.getInstance();
      if (client.isOpen) {
        await client.quit();
        RedisClient.isConnected = false;
        RedisClient.instance = null;
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis connection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const client = RedisClient.getInstance();
      if (ttl) {
        await client.setEx(key, ttl, value);
      } else {
        await client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis SET error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async get(key: string): Promise<string | null> {
    try {
      const client = RedisClient.getInstance();
      return await client.get(key);
    } catch (error) {
      logger.error('Redis GET error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async del(key: string): Promise<void> {
    try {
      const client = RedisClient.getInstance();
      await client.del(key);
    } catch (error) {
      logger.error('Redis DEL error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const client = RedisClient.getInstance();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await RedisClient.set(key, serialized, ttl);
  }

  static async getJson<T>(key: string): Promise<T | null> {
    const value = await RedisClient.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis JSON parse error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  static async isHealthy(): Promise<boolean> {
    try {
      if (!RedisClient.isConnected) return false;
      const client = RedisClient.getInstance();
      await client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  static isConnectionEstablished(): boolean {
    return RedisClient.isConnected;
  }
}

export const redis = RedisClient.getInstance;
