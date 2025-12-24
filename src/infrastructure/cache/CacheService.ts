import { redisClient } from "./RedisClient";
import { Logger } from "../../shared/infrastructure/logger/logger";

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redisClient.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch (error) {
      Logger.error("Cache get error", error, { key });
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 3600
  ): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(value), ttlSeconds);
    } catch (error) {
      Logger.error("Cache set error", error, { key });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redisClient.delete(key);
    } catch (error) {
      Logger.error("Cache delete error", error, { key });
    }
  }

  // User session cache
  async getUserSession(userId: string): Promise<any | null> {
    return this.get(`user:session:${userId}`);
  }

  async setUserSession(
    userId: string,
    data: any,
    ttl: number = 900
  ): Promise<void> {
    await this.set(`user:session:${userId}`, data, ttl);
  }

  async invalidateUserSession(userId: string): Promise<void> {
    await this.delete(`user:session:${userId}`);
  }
}

export const cacheService = new CacheService();
