import { IAccountLockoutService } from "../../domain/services/IAccountLockoutService";
import { Logger } from "../../../../shared/infrastructure/logger/logger";
import { env } from "../../../../config/env";

interface LockoutData {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

export class AccountLockoutService implements IAccountLockoutService {
  private lockouts: Map<string, LockoutData> = new Map();
  private readonly MAX_ATTEMPTS = env.MAX_LOGIN_ATTEMPTS;
  private readonly LOCK_DURATION = env.LOCK_TIME; // 30 minutes
  private readonly ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

  async recordFailedAttempt(userId: string): Promise<void> {
    const now = Date.now();
    const data = this.lockouts.get(userId);

    if (!data) {
      // First failed attempt
      this.lockouts.set(userId, {
        attempts: 1,
        firstAttemptAt: now,
      });
      return;
    }

    // Check if we're in a new attempt window
    if (now - data.firstAttemptAt > this.ATTEMPT_WINDOW) {
      // Reset to new window
      this.lockouts.set(userId, {
        attempts: 1,
        firstAttemptAt: now,
      });
      return;
    }

    // Increment attempts
    data.attempts++;

    // Lock account if max attempts reached
    if (data.attempts >= this.MAX_ATTEMPTS) {
      data.lockedUntil = now + this.LOCK_DURATION;

      Logger.security("Account locked due to failed login attempts", {
        userId,
        attempts: data.attempts,
        lockedUntil: new Date(data.lockedUntil).toISOString(),
      });
    }

    this.lockouts.set(userId, data);
  }

  async isLocked(userId: string): Promise<boolean> {
    const data = this.lockouts.get(userId);

    if (!data?.lockedUntil) {
      return false;
    }

    const now = Date.now();

    // Check if lock has expired
    if (now > data.lockedUntil) {
      // Reset the lockout
      this.lockouts.delete(userId);
      return false;
    }

    return true;
  }

  async getRemainingLockTime(userId: string): Promise<number> {
    const data = this.lockouts.get(userId);

    if (!data?.lockedUntil) {
      return 0;
    }

    const now = Date.now();
    const remaining = data.lockedUntil - now;

    return remaining > 0 ? remaining : 0;
  }

  async resetAttempts(userId: string): Promise<void> {
    this.lockouts.delete(userId);
    Logger.debug("Login attempts reset", { userId });
  }

  // Get attempts for monitoring
  getAttempts(userId: string): number {
    return this.lockouts.get(userId)?.attempts || 0;
  }

  // Cleanup expired locks
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, data] of this.lockouts.entries()) {
      if (data.lockedUntil && now > data.lockedUntil) {
        this.lockouts.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      Logger.debug("Cleaned up expired account locks", { count: cleaned });
    }
  }
}
