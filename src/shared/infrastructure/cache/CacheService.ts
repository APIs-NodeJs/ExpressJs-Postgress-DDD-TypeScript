import { createClient, RedisClientType } from "redis";
import { config } from "../../../config/env.config";
import { logger } from "../../../shared/utils/logger";

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (!config.REDIS_HOST) {
      logger.warn("Redis not configured, caching disabled");
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
        },
        password: config.REDIS_PASSWORD,
      });

      await this.client.connect();
      this.isConnected = true;
      logger.info("✅ Redis connection established");
    } catch (error) {
      logger.error("❌ Redis connection failed:", error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error("Cache get error:", { key, error });
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error("Cache set error:", { key, error });
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error("Cache delete error:", { key, error });
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error("Cache invalidate error:", { pattern, error });
    }
  }
}

export const cacheService = new CacheService();
