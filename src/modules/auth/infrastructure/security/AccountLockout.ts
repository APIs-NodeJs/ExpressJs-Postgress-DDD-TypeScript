
import { RedisClient } from '@infrastructure/cache/redis';
import { logger } from '@infrastructure/logging/logger';

export class AccountLockoutService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60; // 15 minutes
  private static readonly ATTEMPT_WINDOW = 5 * 60; // 5 minutes

  static async recordFailedAttempt(email: string): Promise<{
    locked: boolean;
    attemptsRemaining: number;
    lockoutEndsAt?: Date;
  }> {
    const key = `login:attempts:${email}`;
    const lockKey = `login:locked:${email}`;

    // Check if already locked
    const isLocked = await RedisClient.exists(lockKey);
    if (isLocked) {
      const ttl = await RedisClient.ttl(lockKey);
      return {
        locked: true,
        attemptsRemaining: 0,
        lockoutEndsAt: new Date(Date.now() + ttl * 1000),
      };
    }

    // Increment attempt count
    const attempts = await RedisClient.incr(key);
    
    // Set expiry on first attempt
    if (attempts === 1) {
      await RedisClient.set(key, attempts, this.ATTEMPT_WINDOW);
    }

    // Lock account if max attempts reached
    if (attempts >= this.MAX_ATTEMPTS) {
      await RedisClient.set(lockKey, 'locked', this.LOCKOUT_DURATION);
      await RedisClient.del(key);
      
      logger.warn('Account locked due to failed login attempts', {
        email,
        attempts,
      });

      return {
        locked: true,
        attemptsRemaining: 0,
        lockoutEndsAt: new Date(Date.now() + this.LOCKOUT_DURATION * 1000),
      };
    }

    return {
      locked: false,
      attemptsRemaining: this.MAX_ATTEMPTS - attempts,
    };
  }

  static async clearFailedAttempts(email: string): Promise<void> {
    const key = `login:attempts:${email}`;
    await RedisClient.del(key);
  }

  static async isAccountLocked(email: string): Promise<boolean> {
    const lockKey = `login:locked:${email}`;
    return RedisClient.exists(lockKey);
  }

  static async getRemainingLockoutTime(email: string): Promise<number> {
    const lockKey = `login:locked:${email}`;
    return RedisClient.ttl(lockKey);
  }
}
