import { createClient, RedisClientType } from "redis";
import { env } from "../../config/env";
import { Logger } from "../../shared/infrastructure/logger/logger";

export class RedisClient {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  /**
   * Connect to Redis server
   */
  async connect(): Promise<void> {
    // Skip if Redis URL is not configured
    if (!env.REDIS_URL) {
      Logger.warn("Redis URL not configured, caching will be disabled");
      return;
    }

    // Skip if already connected
    if (this.isConnected && this.client?.isOpen) {
      Logger.debug("Redis already connected");
      return;
    }

    try {
      this.client = createClient({
        url: env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            // Exponential backoff with max 3 seconds
            const delay = Math.min(retries * 100, 3000);
            Logger.debug(`Redis reconnect attempt ${retries} in ${delay}ms`);
            return delay;
          },
        },
      });

      // Set up event listeners
      this.client.on("error", (err) => {
        Logger.error("Redis client error", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        Logger.info("Redis client connecting...");
      });

      this.client.on("ready", () => {
        Logger.info("Redis client connected and ready");
        this.isConnected = true;
      });

      this.client.on("end", () => {
        Logger.info("Redis connection closed");
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        Logger.warn("Redis client reconnecting...");
        this.isConnected = false;
      });

      // Connect with timeout
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis connection timeout")), 5000)
        ),
      ]);

      Logger.info("✅ Redis connected successfully");
    } catch (error) {
      Logger.error("Failed to connect to Redis", error);
      this.client = null;
      this.isConnected = false;
      // Don't throw - allow app to run without Redis
    }
  }

  /**
   * Get value from Redis
   */
  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      Logger.debug("Redis not available, skipping get");
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      Logger.error("Redis get error", error, { key });
      return null;
    }
  }

  /**
   * Set value in Redis with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      Logger.debug("Redis not available, skipping set");
      return;
    }

    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      Logger.error("Redis set error", error, { key });
    }
  }

  /**
   * Delete key from Redis
   */
  async delete(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      Logger.debug("Redis not available, skipping delete");
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      Logger.error("Redis delete error", error, { key });
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      Logger.error("Redis exists error", error, { key });
      return false;
    }
  }

  /**
   * Set with expiry using SETEX
   */
  async setWithExpiry(
    key: string,
    value: string,
    seconds: number
  ): Promise<void> {
    if (!this.client || !this.isConnected) {
      Logger.debug("Redis not available, skipping setWithExpiry");
      return;
    }

    try {
      await this.client.setEx(key, seconds, value);
    } catch (error) {
      Logger.error("Redis setWithExpiry error", error, { key });
    }
  }

  /**
   * Get multiple keys at once
   */
  async mGet(keys: string[]): Promise<(string | null)[]> {
    if (!this.client || !this.isConnected || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      return await this.client.mGet(keys);
    } catch (error) {
      Logger.error("Redis mGet error", error, { keys });
      return keys.map(() => null);
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        Logger.info("Redis disconnected gracefully");
      } catch (error) {
        Logger.error("Error disconnecting from Redis", error);
        // Force close if quit fails
        await this.client?.disconnect();
      }
    }
  }

  /**
   * Check if Redis is connected and healthy
   */
  isHealthy(): boolean {
    return this.isConnected && this.client?.isOpen === true;
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      Logger.error("Redis ping failed", error);
      return false;
    }
  }
}

// Export singleton instance
export const redisClient = new RedisClient();
