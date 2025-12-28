import { Logger } from '../../utils/Logger';

interface CacheStore {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class InMemoryCache implements CacheStore {
  private cache: Map<string, { value: any; expiry: number | null }> = new Map();

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + ttl * 1000 : null;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

export const cacheStore: CacheStore = new InMemoryCache();

export function Cacheable(options: { key: string; ttl?: number }) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger('Cache');

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${options.key}:${JSON.stringify(args)}`;

      try {
        const cached = await cacheStore.get(cacheKey);
        if (cached !== null && cached !== undefined) {
          logger.debug(`Cache hit for ${propertyName}`, { key: cacheKey });
          return cached;
        }

        logger.debug(`Cache miss for ${propertyName}`, { key: cacheKey });
        const result = await originalMethod.apply(this, args);

        await cacheStore.set(cacheKey, result, options.ttl);
        logger.debug(`Cache set for ${propertyName}`, { key: cacheKey });

        return result;
      } catch (error) {
        logger.error(`Cache error for ${propertyName}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

export function CacheInvalidate(pattern: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger('Cache');

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      try {
        const cacheKey = `${pattern}:${JSON.stringify(args)}`;
        await cacheStore.del(cacheKey);
        logger.debug(`Cache invalidated for ${propertyName}`, { key: cacheKey });
      } catch (error) {
        logger.error(`Cache invalidation error for ${propertyName}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return result;
    };

    return descriptor;
  };
}