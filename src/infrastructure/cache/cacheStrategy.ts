
import { RedisClient } from './redis';
import { ContextLogger } from '../logging/structuredLogger';

interface CacheOptions {
  ttl?: number;
  key: string;
  tags?: string[];
}

export class CacheStrategy {
  private logger: ContextLogger;

  constructor() {
    this.logger = new ContextLogger({ component: 'CacheStrategy' });
  }

  // Cache-aside pattern with automatic refresh
  async cacheAside<T>(
    options: CacheOptions,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const { key, ttl = 3600, tags = [] } = options;

    try {
      // Try to get from cache
      const cached = await RedisClient.get<T>(key);
      if (cached) {
        this.logger.debug('Cache hit', { key });
        
        // Async refresh if TTL is low (< 10% remaining)
        const remainingTTL = await RedisClient.ttl(key);
        if (remainingTTL > 0 && remainingTTL < ttl * 0.1) {
          this.refreshCacheAsync(key, fetchFn, ttl, tags);
        }
        
        return cached;
      }

      // Cache miss - fetch data
      this.logger.debug('Cache miss', { key });
      const data = await fetchFn();

      // Store in cache
      await RedisClient.set(key, data, ttl);
      
      // Store tags for invalidation
      if (tags.length > 0) {
        await this.addCacheTags(key, tags);
      }

      return data;
    } catch (error) {
      this.logger.error('Cache error', { key, error });
      // Fallback to direct fetch
      return fetchFn();
    }
  }

  // Write-through cache
  async writeThrough<T>(
    key: string,
    data: T,
    saveFn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    try {
      // Save to database first
      const saved = await saveFn();
      
      // Then update cache
      await RedisClient.set(key, saved, ttl);
      
      return saved;
    } catch (error) {
      this.logger.error('Write-through error', { key, error });
      throw error;
    }
  }

  // Cache warming for frequently accessed data
  async warmCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<void> {
    try {
      const data = await fetchFn();
      await RedisClient.set(key, data, ttl);
      this.logger.info('Cache warmed', { key });
    } catch (error) {
      this.logger.error('Cache warming failed', { key, error });
    }
  }

  // Tag-based invalidation
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await RedisClient.get<string[]>(`tag:${tag}`);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map(key => RedisClient.del(key)));
        await RedisClient.del(`tag:${tag}`);
        this.logger.info('Cache invalidated by tag', { tag, count: keys.length });
      }
    } catch (error) {
      this.logger.error('Tag invalidation failed', { tag, error });
    }
  }

  private async refreshCacheAsync<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number,
    tags: string[]
  ): Promise<void> {
    // Don't await - fire and forget
    fetchFn()
      .then(async data => {
        await RedisClient.set(key, data, ttl);
        if (tags.length > 0) {
          await this.addCacheTags(key, tags);
        }
        this.logger.debug('Cache refreshed', { key });
      })
      .catch(error => {
        this.logger.error('Cache refresh failed', { key, error });
      });
  }

  private async addCacheTags(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const existingKeys = await RedisClient.get<string[]>(tagKey) || [];
      existingKeys.push(key);
      await RedisClient.set(tagKey, existingKeys, 86400); // 24 hours
    }
  }
}