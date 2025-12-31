// src/modules/users/infrastructure/persistence/repositories/CachedUserRepository.ts
import { BaseRepository } from '../../../../../core/infrastructure/persistence/BaseRepository';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/valueObjects/Email';
import { UserRole } from '../../../domain/valueObjects/UserRole';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserModel } from '../models/UserModel';
import { UniqueEntityID } from '../../../../../core/domain/Identifier';
import {
  cacheService,
  ICacheService,
} from '../../../../../shared/infrastructure/cache/RedisCacheService';
import { Logger } from '../../../../../core/utils/Logger';

/**
 * Enhanced UserRepository with caching layer
 * Implements the Repository pattern with Redis caching for better performance
 */
export class CachedUserRepository
  extends BaseRepository<User, UserModel, string>
  implements IUserRepository
{
  private readonly logger: Logger;
  private readonly cacheTTL = 3600; // 1 hour
  private readonly cachePrefix = 'user';

  constructor(
    unitOfWork: any,
    private readonly cache: ICacheService = cacheService
  ) {
    super(unitOfWork);
    this.logger = new Logger('CachedUserRepository');
  }

  /**
   * Generate cache key for user ID
   */
  private getCacheKey(id: string): string {
    return `${this.cachePrefix}:${id}`;
  }

  /**
   * Generate cache key for email
   */
  private getEmailCacheKey(email: string): string {
    return `${this.cachePrefix}:email:${email.toLowerCase()}`;
  }

  /**
   * Find user by ID with caching
   */
  async findById(id: string): Promise<User | null> {
    const cacheKey = this.getCacheKey(id);

    try {
      // Try cache first
      const cached = await this.cache.get<any>(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit for user', { id });
        return this.deserializeFromCache(cached);
      }

      this.logger.debug('Cache miss for user', { id });

      // Cache miss - load from database
      const userModel = await UserModel.findByPk(id, {
        transaction: this.getTransaction(),
      });

      if (!userModel) {
        return null;
      }

      const user = this.toDomain(userModel);

      // Store in cache
      await this.cacheUser(user);

      return user;
    } catch (error) {
      this.logger.error('Error finding user by ID', {
        error: error instanceof Error ? error.message : String(error),
        id,
      });
      throw error;
    }
  }

  /**
   * Find user by email with caching
   */
  async findByEmail(email: Email): Promise<User | null> {
    const emailCacheKey = this.getEmailCacheKey(email.value);

    try {
      // Try to get user ID from email cache
      const cachedUserId = await this.cache.get<string>(emailCacheKey);

      if (cachedUserId) {
        this.logger.debug('Email cache hit', { email: email.value });
        return this.findById(cachedUserId);
      }

      this.logger.debug('Email cache miss', { email: email.value });

      // Cache miss - load from database
      const userModel = await UserModel.findOne({
        where: { email: email.value },
        transaction: this.getTransaction(),
      });

      if (!userModel) {
        return null;
      }

      const user = this.toDomain(userModel);

      // Store in cache
      await this.cacheUser(user);

      return user;
    } catch (error) {
      this.logger.error('Error finding user by email', {
        error: error instanceof Error ? error.message : String(error),
        email: email.value,
      });
      throw error;
    }
  }

  /**
   * Find user by Google ID (no caching for now)
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const userModel = await UserModel.findOne({
        where: { googleId },
        transaction: this.getTransaction(),
      });

      if (!userModel) {
        return null;
      }

      const user = this.toDomain(userModel);

      // Cache the user
      await this.cacheUser(user);

      return user;
    } catch (error) {
      this.logger.error('Error finding user by Google ID', {
        error: error instanceof Error ? error.message : String(error),
        googleId,
      });
      throw error;
    }
  }

  /**
   * Save user and invalidate cache
   */
  async save(user: User): Promise<void> {
    try {
      const exists = await this.exists(user.id);
      const persistence = this.toPersistence(user);

      if (exists) {
        await UserModel.update(persistence, {
          where: { id: user.id },
          transaction: this.getTransaction(),
        });
      } else {
        await UserModel.create(persistence as any, {
          transaction: this.getTransaction(),
        });
      }

      // Invalidate cache after save
      await this.invalidateUserCache(user);

      this.logger.debug('User saved and cache invalidated', { userId: user.id });
    } catch (error) {
      this.logger.error('Error saving user', {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
      });
      throw error;
    }
  }

  /**
   * Delete user and invalidate cache
   */
  async delete(id: string): Promise<void> {
    try {
      // Get user first to invalidate all cache keys
      const user = await this.findById(id);

      await UserModel.destroy({
        where: { id },
        transaction: this.getTransaction(),
      });

      if (user) {
        await this.invalidateUserCache(user);
      }

      this.logger.debug('User deleted and cache invalidated', { userId: id });
    } catch (error) {
      this.logger.error('Error deleting user', {
        error: error instanceof Error ? error.message : String(error),
        userId: id,
      });
      throw error;
    }
  }

  /**
   * Check if user exists (with cache)
   */
  async exists(id: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(id);

    // Check cache first
    const cached = await this.cache.exists(cacheKey);
    if (cached) {
      return true;
    }

    // Check database
    const count = await UserModel.count({
      where: { id },
      transaction: this.getTransaction(),
    });

    return count > 0;
  }

  /**
   * Cache user data
   */
  private async cacheUser(user: User): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(user.id);
      const emailCacheKey = this.getEmailCacheKey(user.email.value);

      // Serialize user for cache
      const cacheData = this.serializeForCache(user);

      // Cache user data
      await this.cache.set(cacheKey, cacheData, this.cacheTTL);

      // Cache email -> user ID mapping
      await this.cache.set(emailCacheKey, user.id, this.cacheTTL);

      this.logger.debug('User cached', { userId: user.id });
    } catch (error) {
      // Log but don't throw - caching failures shouldn't break the app
      this.logger.error('Failed to cache user', {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
      });
    }
  }

  /**
   * Invalidate all cache keys for a user
   */
  private async invalidateUserCache(user: User): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(user.id);
      const emailCacheKey = this.getEmailCacheKey(user.email.value);

      await this.cache.delete(cacheKey);
      await this.cache.delete(emailCacheKey);

      this.logger.debug('User cache invalidated', { userId: user.id });
    } catch (error) {
      this.logger.error('Failed to invalidate user cache', {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
      });
    }
  }

  /**
   * Serialize user for cache storage
   */
  private serializeForCache(user: User): any {
    return {
      id: user.id,
      email: user.email.value,
      firstName: user.firstName,
      lastName: user.lastName,
      passwordHash: user.passwordHash,
      googleId: user.googleId,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Deserialize user from cache
   */
  private deserializeFromCache(data: any): User {
    const emailResult = Email.create(data.email);
    if (emailResult.isFailure) {
      throw new Error('Invalid email in cache');
    }

    const userResult = User.create(
      {
        email: emailResult.getValue(),
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash: data.passwordHash,
        googleId: data.googleId,
        role: data.role as UserRole,
        isActive: data.isActive,
        emailVerified: data.emailVerified,
      },
      new UniqueEntityID(data.id)
    );

    if (userResult.isFailure) {
      throw new Error('Failed to deserialize user from cache');
    }

    return userResult.getValue();
  }

  /**
   * Convert database model to domain entity
   */
  protected toDomain(model: UserModel): User {
    const emailResult = Email.create(model.email);
    if (emailResult.isFailure) {
      throw new Error('Invalid email in database');
    }

    const userResult = User.create(
      {
        email: emailResult.getValue(),
        firstName: model.firstName,
        lastName: model.lastName,
        passwordHash: model.passwordHash,
        googleId: model.googleId,
        role: model.role as UserRole,
        isActive: model.isActive,
        emailVerified: model.emailVerified,
      },
      new UniqueEntityID(model.id)
    );

    if (userResult.isFailure) {
      throw new Error('Failed to create user domain entity');
    }

    return userResult.getValue();
  }

  /**
   * Convert domain entity to persistence model
   */
  protected toPersistence(user: User): Partial<UserModel> {
    return {
      id: user.id,
      email: user.email.value,
      firstName: user.firstName,
      lastName: user.lastName,
      passwordHash: user.passwordHash,
      googleId: user.googleId,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      updatedAt: user.updatedAt,
    };
  }
}
