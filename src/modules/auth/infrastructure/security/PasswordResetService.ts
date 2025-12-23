
import { v4 as uuidv4 } from 'uuid';
import { RedisClient } from '@infrastructure/cache/redis';
import { logger } from '@infrastructure/logging/logger';

interface ResetTokenData {
  userId: string;
  email: string;
  createdAt: number;
}

export class PasswordResetService {
  private static readonly TOKEN_EXPIRY = 60 * 60; // 1 hour
  private static readonly PREFIX = 'password:reset:';

  static async generateResetToken(userId: string, email: string): Promise<string> {
    const token = uuidv4();
    const key = `${this.PREFIX}${token}`;

    const data: ResetTokenData = {
      userId,
      email,
      createdAt: Date.now(),
    };

    await RedisClient.set(key, data, this.TOKEN_EXPIRY);
    
    logger.info('Password reset token generated', {
      userId,
      email,
      expiresIn: this.TOKEN_EXPIRY,
    });

    return token;
  }

  static async verifyResetToken(token: string): Promise<ResetTokenData | null> {
    const key = `${this.PREFIX}${token}`;
    const data = await RedisClient.get<ResetTokenData>(key);

    if (!data) {
      logger.warn('Invalid or expired password reset token', { token });
      return null;
    }

    return data;
  }

  static async invalidateResetToken(token: string): Promise<void> {
    const key = `${this.PREFIX}${token}`;
    await RedisClient.del(key);
    logger.info('Password reset token invalidated', { token });
  }

  static async invalidateAllUserTokens(userId: string): Promise<void> {
    const pattern = `${this.PREFIX}*`;
    const keys = await RedisClient.keys(pattern);

    for (const key of keys) {
      const data = await RedisClient.get<ResetTokenData>(key);
      if (data?.userId === userId) {
        await RedisClient.del(key);
      }
    }

    logger.info('All password reset tokens invalidated for user', { userId });
  }
}
