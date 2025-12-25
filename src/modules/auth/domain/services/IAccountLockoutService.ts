export interface IAccountLockoutService {
  recordFailedAttempt(userId: string): Promise<void>;
  isLocked(userId: string): Promise<boolean>;
  getRemainingLockTime(userId: string): Promise<number>;
  resetAttempts(userId: string): Promise<void>;
}
