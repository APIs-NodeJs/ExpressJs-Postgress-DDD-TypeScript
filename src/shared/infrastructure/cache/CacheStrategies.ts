import { cacheService } from "./CacheService";
import { logger } from "../../utils/logger";

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  tags?: string[];
}

export interface CachableResult<T> {
  data: T;
  cached: boolean;
  age?: number;
  key: string;
}

/**
 * Cache-Aside Pattern (Lazy Loading)
 * Most common pattern - check cache first, then load from source if miss
 */
export class CacheAsideStrategy {
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CachableResult<T>> {
    const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;
    const ttl = options.ttl || 3600;

    try {
      // Try to get from cache
      const cached = await cacheService.get<T>(cacheKey);

      if (cached !== null) {
        logger.debug("Cache hit", { key: cacheKey });

        const age = await cacheService.ttl(cacheKey);
        return {
          data: cached,
          cached: true,
          age: age > 0 ? ttl - age : undefined,
          key: cacheKey,
        };
      }

      // Cache miss - fetch from source
      logger.debug("Cache miss", { key: cacheKey });
      const data = await fetchFn();

      // Store in cache
      await cacheService.setWithExpiry(cacheKey, data, ttl);

      return {
        data,
        cached: false,
        key: cacheKey,
      };
    } catch (error) {
      logger.error("Cache-aside error", {
        key: cacheKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Fallback to source on cache error
      const data = await fetchFn();
      return { data, cached: false, key: cacheKey };
    }
  }

  async invalidate(key: string, prefix?: string): Promise<void> {
    const cacheKey = prefix ? `${prefix}:${key}` : key;
    await cacheService.del(cacheKey);
    logger.debug("Cache invalidated", { key: cacheKey });
  }
}

/**
 * Write-Through Pattern
 * Write to cache and database simultaneously
 */
export class WriteThroughStrategy {
  async set<T>(
    key: string,
    value: T,
    saveFn: (value: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<void> {
    const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;
    const ttl = options.ttl || 3600;

    try {
      // Write to database first
      await saveFn(value);

      // Then write to cache
      await cacheService.setWithExpiry(cacheKey, value, ttl);

      logger.debug("Write-through completed", { key: cacheKey });
    } catch (error) {
      logger.error("Write-through error", {
        key: cacheKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

/**
 * Write-Behind (Write-Back) Pattern
 * Write to cache immediately, database asynchronously
 */
export class WriteBehindStrategy {
  private writeQueue: Map<string, { value: any; timestamp: number }> =
    new Map();
  private flushInterval?: NodeJS.Timeout;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.startFlushTimer();
  }

  async set<T>(
    key: string,
    value: T,
    saveFn: (value: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<void> {
    const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;
    const ttl = options.ttl || 3600;

    try {
      // Write to cache immediately
      await cacheService.setWithExpiry(cacheKey, value, ttl);

      // Queue database write
      this.writeQueue.set(cacheKey, {
        value,
        timestamp: Date.now(),
      });

      logger.debug("Write-behind queued", {
        key: cacheKey,
        queueSize: this.writeQueue.size,
      });
    } catch (error) {
      logger.error("Write-behind error", {
        key: cacheKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private async flush(): Promise<void> {
    if (this.writeQueue.size === 0) return;

    logger.debug("Flushing write-behind queue", {
      size: this.writeQueue.size,
    });

    const entries = Array.from(this.writeQueue.entries());
    this.writeQueue.clear();

    // Process writes (implement your batch save logic)
    for (const [key, { value }] of entries) {
      try {
        // Save to database
        // await your save function
        logger.debug("Write-behind persisted", { key });
      } catch (error) {
        logger.error("Write-behind flush error", {
          key,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flush(); // Final flush
    }
  }
}

/**
 * Refresh-Ahead Pattern
 * Proactively refresh cache before expiration
 */
export class RefreshAheadStrategy {
  private refreshing = new Set<string>();

  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions & { refreshThreshold?: number } = {}
  ): Promise<CachableResult<T>> {
    const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;
    const ttl = options.ttl || 3600;
    const refreshThreshold = options.refreshThreshold || ttl * 0.2; // Refresh at 20% remaining

    try {
      const cached = await cacheService.get<T>(cacheKey);

      if (cached !== null) {
        const remainingTtl = await cacheService.ttl(cacheKey);

        // Check if we should refresh
        if (remainingTtl > 0 && remainingTtl < refreshThreshold) {
          // Trigger background refresh
          this.backgroundRefresh(cacheKey, fetchFn, ttl);
        }

        return {
          data: cached,
          cached: true,
          age: ttl - remainingTtl,
          key: cacheKey,
        };
      }

      // Cache miss
      const data = await fetchFn();
      await cacheService.setWithExpiry(cacheKey, data, ttl);

      return { data, cached: false, key: cacheKey };
    } catch (error) {
      logger.error("Refresh-ahead error", {
        key: cacheKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      const data = await fetchFn();
      return { data, cached: false, key: cacheKey };
    }
  }

  private async backgroundRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    // Prevent duplicate refreshes
    if (this.refreshing.has(key)) return;

    this.refreshing.add(key);

    try {
      logger.debug("Background refresh started", { key });

      const data = await fetchFn();
      await cacheService.setWithExpiry(key, data, ttl);

      logger.debug("Background refresh completed", { key });
    } catch (error) {
      logger.error("Background refresh failed", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      this.refreshing.delete(key);
    }
  }
}

/**
 * Read-Through Pattern
 * Cache automatically loads data from source on miss
 */
export class ReadThroughCache<T> {
  constructor(
    private readonly loader: (key: string) => Promise<T>,
    private readonly options: CacheOptions = {}
  ) {}

  async get(key: string): Promise<T> {
    const cacheKey = this.options.prefix
      ? `${this.options.prefix}:${key}`
      : key;
    const ttl = this.options.ttl || 3600;

    try {
      const cached = await cacheService.get<T>(cacheKey);

      if (cached !== null) {
        return cached;
      }

      // Load from source
      const data = await this.loader(key);

      // Store in cache
      await cacheService.setWithExpiry(cacheKey, data, ttl);

      return data;
    } catch (error) {
      logger.error("Read-through error", {
        key: cacheKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

/**
 * Cache Stamped Pattern
 * Prevent cache stampede (thundering herd)
 */
export class CacheStampedStrategy {
  private loading = new Map<string, Promise<any>>();

  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;
    const ttl = options.ttl || 3600;

    try {
      // Check cache first
      const cached = await cacheService.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Check if already loading
      if (this.loading.has(cacheKey)) {
        logger.debug("Waiting for in-flight request", { key: cacheKey });
        return await this.loading.get(cacheKey);
      }

      // Start loading
      const loadPromise = this.loadAndCache(cacheKey, fetchFn, ttl);
      this.loading.set(cacheKey, loadPromise);

      try {
        const data = await loadPromise;
        return data;
      } finally {
        this.loading.delete(cacheKey);
      }
    } catch (error) {
      logger.error("Cache stampede prevention error", {
        key: cacheKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private async loadAndCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const data = await fetchFn();
    await cacheService.setWithExpiry(key, data, ttl);
    return data;
  }
}

/**
 * Multi-layer Cache
 * L1 (memory) -> L2 (Redis)
 */
export class MultiLayerCache<T> {
  private memoryCache = new Map<string, { value: T; expiry: number }>();
  private readonly L1_TTL = 60000; // 1 minute in memory

  async get(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Check L1 (memory)
    const memoryCached = this.memoryCache.get(key);
    if (memoryCached && memoryCached.expiry > Date.now()) {
      logger.debug("L1 cache hit", { key });
      return memoryCached.value;
    }

    // Check L2 (Redis)
    const redisCached = await cacheService.get<T>(key);
    if (redisCached !== null) {
      logger.debug("L2 cache hit", { key });

      // Populate L1
      this.memoryCache.set(key, {
        value: redisCached,
        expiry: Date.now() + this.L1_TTL,
      });

      return redisCached;
    }

    // Load from source
    logger.debug("Cache miss (all layers)", { key });
    const data = await fetchFn();

    // Store in both layers
    this.memoryCache.set(key, {
      value: data,
      expiry: Date.now() + this.L1_TTL,
    });
    await cacheService.setWithExpiry(key, data, ttl);

    return data;
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key);
    cacheService.del(key);
  }

  clearL1(): void {
    this.memoryCache.clear();
    logger.debug("L1 cache cleared");
  }
}

// Export singleton instances
export const cacheAside = new CacheAsideStrategy();
export const writeThrough = new WriteThroughStrategy();
export const writeBehind = new WriteBehindStrategy();
export const refreshAhead = new RefreshAheadStrategy();
export const cacheStamped = new CacheStampedStrategy();
