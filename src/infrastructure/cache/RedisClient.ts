import { createClient, RedisClientType } from "redis";
import { env } from "../../config/env";
import { Logger } from "../../shared/infrastructure/logger/logger";

export class RedisClient {
  private client: RedisClientType | null = null;

  async connect(): Promise<void> {
    if (!env.REDIS_URL) {
      Logger.warn("Redis URL not configured, caching disabled");
      return;
    }

    try {
      this.client = createClient({ url: env.REDIS_URL });

      this.client.on("error", (err) => Logger.error("Redis error", err));
      this.client.on("connect", () => Logger.info("Redis connected"));

      await this.client.connect();
    } catch (error) {
      Logger.error("Failed to connect to Redis", error);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}

export const redisClient = new RedisClient();
