import { injectable, inject } from "tsyringe";
import * as speakeasy from "speakeasy";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { Logger } from "../../../../shared/infrastructure/logger/logger";
import { createHash } from "crypto";

export interface Verify2FARequest {
  userId: string;
  token: string;
}

export interface Verify2FAResponse {
  verified: boolean;
}

@injectable()
export class Verify2FAUseCase implements UseCase<
  Verify2FARequest,
  Verify2FAResponse
> {
  constructor(
    @inject(TOKENS.IUserRepository) private userRepo: IUserRepository
  ) {}

  async execute(req: Verify2FARequest): Promise<Result<Verify2FAResponse>> {
    try {
      const user = await this.userRepo.findById(req.userId);
      
      if (!user) {
        return Result.fail("User not found");
      }

      // Check if 2FA is configured
      const userWithSecret = user as any; // Type assertion for additional fields
      if (!userWithSecret.twoFactorSecret) {
        return Result.fail("2FA not configured for this user");
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: userWithSecret.twoFactorSecret,
        encoding: "base32",
        token: req.token,
        window: 2, // Allow 2 time steps before/after for clock drift
      });

      if (verified) {
        // Enable 2FA on first successful verification
        if (!userWithSecret.twoFactorEnabled) {
          await this.userRepo.update(user.id, { 
            twoFactorEnabled: true 
          } as any);
          
          Logger.info("2FA enabled successfully", { userId: user.id });
        }
        
        return Result.ok({ verified: true });
      }

      // Check backup codes if TOTP verification failed
      if (userWithSecret.backupCodes && Array.isArray(userWithSecret.backupCodes)) {
        // Hash the provided token to compare with stored hashed backup codes
        const hashedToken = createHash('sha256').update(req.token).digest('hex');
        
        const backupCodeMatch = userWithSecret.backupCodes.includes(hashedToken);
        
        if (backupCodeMatch) {
          // Remove used backup code
          const updatedCodes = userWithSecret.backupCodes.filter(
            (code: string) => code !== hashedToken
          );
          
          await this.userRepo.update(user.id, { 
            backupCodes: updatedCodes 
          } as any);
          
          Logger.info("2FA verified with backup code", { 
            userId: user.id,
            remainingBackupCodes: updatedCodes.length 
          });
          
          return Result.ok({ verified: true });
        }
      }

      Logger.warn("2FA verification failed", { userId: user.id });
      return Result.fail("Invalid 2FA token");
      
    } catch (error) {
      Logger.error("2FA verification error", error, { userId: req.userId });
      return Result.fail("Failed to verify 2FA token");
    }
  }
}