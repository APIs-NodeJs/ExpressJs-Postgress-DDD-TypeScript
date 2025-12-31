// src/shared/infrastructure/cache/RedisCacheService.ts
import { Logger } from '../../../core/utils/Logger';
import { config } from '../../config/env.config';

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  increment(key: string, value?: number): Promise<number>;
  decrement(key: string, value?: number): Promise<number>;
  setExpiry(key: string, ttl: number): Promise<void>;
}

/**
 * In-memory cache implementation (for development)
 */
class InMemoryCacheService implements ICacheService {
  private cache: Map<string, { value: any; expiresAt: number | null }>;
  private readonly logger: Logger;

  constructor() {
    this.cache = new Map();
    this.logger = new Logger('InMemoryCache');

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.logger.debug('Cache miss', { key });
      return null;
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.logger.debug('Cache expired', { key });
      return null;
    }

    this.logger.debug('Cache hit', { key });
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : null;

    this.cache.set(key, { value, expiresAt });
    this.logger.debug('Cache set', { key, ttl });
  }

  async delete(key: string): Promise<void> {
    const deleted = this.cache.delete(key);
    this.logger.debug('Cache delete', { key, deleted });
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.logger.debug('Cache invalidated', { pattern, count });
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async increment(key: string, value: number = 1): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const newValue = current + value;
    await this.set(key, newValue);
    return newValue;
  }

  async decrement(key: string, value: number = 1): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const newValue = current - value;
    await this.set(key, newValue);
    return newValue;
  }

  async setExpiry(key: string, ttl: number): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttl * 1000;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug('Cache cleanup completed', { cleaned });
    }
  }
}

/**
 * Redis cache implementation (for production)
 * Note: Requires ioredis to be installed
 */
class RedisCacheService implements ICacheService {
  private client: any; // Redis client type
  private readonly logger: Logger;
  private connected: boolean = false;

  constructor() {
    this.logger = new Logger('RedisCache');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Note: This requires 'ioredis' package to be installed
      // npm install ioredis
      // const Redis = require('ioredis');

      // Placeholder implementation
      this.logger.warn('Redis client not initialized. Install ioredis package.');

      // In production, you would initialize like this:
      // this.client = new Redis({
      //   host: config.REDIS_HOST || 'localhost',
      //   port: config.REDIS_PORT || 6379,
      //   password: config.REDIS_PASSWORD,
      //   maxRetriesPerRequest: 3,
      //   enableReadyCheck: true,
      //   lazyConnect: false,
      //   retryStrategy: (times) => {
      //     const delay = Math.min(times * 50, 2000);
      //     return delay;
      //   }
      // });

      // this.client.on('connect', () => {
      //   this.logger.info('Redis connected');
      //   this.connected = true;
      // });

      // this.client.on('error', (error: Error) => {
      //   this.logger.error('Redis error', { error: error.message });
      //   this.connected = false;
      // });

      // await this.client.ping();
      // this.logger.info('Redis connection established');
    } catch (error) {
      this.logger.error('Failed to initialize Redis', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) {
      return null;
    }

    try {
      // const value = await this.client.get(key);
      // return value ? JSON.parse(value) : null;

      this.logger.debug('Redis get (placeholder)', { key });
      return null;
    } catch (error) {
      this.logger.error('Redis get error', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      // const serialized = JSON.stringify(value);
      // await this.client.setex(key, ttl, serialized);

      this.logger.debug('Redis set (placeholder)', { key, ttl });
    } catch (error) {
      this.logger.error('Redis set error', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      // await this.client.del(key);
      this.logger.debug('Redis delete (placeholder)', { key });
    } catch (error) {
      this.logger.error('Redis delete error', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
    }
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      // const keys = await this.client.keys(pattern);
      // if (keys.length > 0) {
      //   await this.client.del(...keys);
      // }

      this.logger.debug('Redis invalidate (placeholder)', { pattern });
    } catch (error) {
      this.logger.error('Redis invalidate error', {
        error: error instanceof Error ? error.message : String(error),
        pattern,
      });
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    try {
      // const result = await this.client.exists(key);
      // return result === 1;

      this.logger.debug('Redis exists (placeholder)', { key });
      return false;
    } catch (error) {
      this.logger.error('Redis exists error', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      return false;
    }
  }

  async increment(key: string, value: number = 1): Promise<number> {
    if (!this.connected) {
      return 0;
    }

    try {
      // return await this.client.incrby(key, value);
      this.logger.debug('Redis increment (placeholder)', { key, value });
      return 0;
    } catch (error) {
      this.logger.error('Redis increment error', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      return 0;
    }
  }

  async decrement(key: string, value: number = 1): Promise<number> {
    if (!this.connected) {
      return 0;
    }

    try {
      // return await this.client.decrby(key, value);
      this.logger.debug('Redis decrement (placeholder)', { key, value });
      return 0;
    } catch (error) {
      this.logger.error('Redis decrement error', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      return 0;
    }
  }

  async setExpiry(key: string, ttl: number): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      // await this.client.expire(key, ttl);
      this.logger.debug('Redis setExpiry (placeholder)', { key, ttl });
    } catch (error) {
      this.logger.error('Redis setExpiry error', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      // await this.client.quit();
      this.connected = false;
      this.logger.info('Redis disconnected');
    }
  }
}

/**
 * Factory function to create appropriate cache service
 */
function createCacheService(): ICacheService {
  const logger = new Logger('CacheFactory');

  if (config.NODE_ENV === 'production' && config.REDIS_HOST) {
    logger.info('Creating Redis cache service');
    return new RedisCacheService();
  }

  logger.info('Creating in-memory cache service');
  return new InMemoryCacheService();
}

// Export singleton instance
export const cacheService = createCacheService();
