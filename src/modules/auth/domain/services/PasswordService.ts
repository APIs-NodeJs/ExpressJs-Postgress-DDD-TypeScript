// src/modules/auth/domain/services/PasswordService.ts
import * as bcrypt from 'bcrypt';
import { Result } from '../../../../core/domain/Result';

export class PasswordService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MIN_LENGTH = 8;

  public static async hash(plainPassword: string): Promise<Result<string>> {
    try {
      const hash = await bcrypt.hash(plainPassword, this.SALT_ROUNDS);
      return Result.ok<string>(hash);
    } catch (error) {
      return Result.fail<string>('Failed to hash password');
    }
  }

  public static async compare(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      return false;
    }
  }

  public static validate(password: string): Result<void> {
    if (!password || password.length < this.MIN_LENGTH) {
      return Result.fail<void>(`Password must be at least ${this.MIN_LENGTH} characters`);
    }

    if (!/[A-Z]/.test(password)) {
      return Result.fail<void>('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      return Result.fail<void>('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      return Result.fail<void>('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return Result.fail<void>('Password must contain at least one special character');
    }

    return Result.ok<void>();
  }
}
