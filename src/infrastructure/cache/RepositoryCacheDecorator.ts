
import { RedisClient } from '@infrastructure/cache/redis';
import { logger } from '@infrastructure/logging/logger';

export class RepositoryCacheDecorator<TDomain, TRepository> {
  constructor(
    private repository: TRepository,
    private entityName: string,
    private defaultTTL: number = 300 // 5 minutes
  ) {}

  async findById(id: string): Promise<TDomain | null> {
    const cacheKey = `${this.entityName}:${id}`;
    
    try {
      // Try cache first
      const cached = await RedisClient.get<TDomain>(cacheKey);
      if (cached) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return cached;
      }
    } catch (error) {
      logger.warn(`Cache read error: ${cacheKey}`, { error });
    }

    // Fetch from database
    const result = await (this.repository as any).findById(id);
    
    // Cache the result
    if (result) {
      try {
        await RedisClient.set(cacheKey, result, this.defaultTTL);
      } catch (error) {
        logger.warn(`Cache write error: ${cacheKey}`, { error });
      }
    }

    return result;
  }

  async invalidate(id: string): Promise<void> {
    const cacheKey = `${this.entityName}:${id}`;
    try {
      await RedisClient.del(cacheKey);
      logger.debug(`Cache invalidated: ${cacheKey}`);
    } catch (error) {
      logger.warn(`Cache invalidation error: ${cacheKey}`, { error });
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const count = await RedisClient.delPattern(`${this.entityName}:${pattern}`);
      logger.debug(`Cache pattern invalidated: ${pattern}, count: ${count}`);
    } catch (error) {
      logger.warn(`Cache pattern invalidation error: ${pattern}`, { error });
    }
  }
}