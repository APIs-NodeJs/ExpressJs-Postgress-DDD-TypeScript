import { injectable, inject } from "tsyringe";
import * as speakeasy from "speakeasy";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { TOKENS } from "../../../../infrastructure/di/tokens";

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
    const user = await this.userRepo.findById(req.userId);
    if (!user || !user.twoFactorSecret) {
      return Result.fail("2FA not configured");
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: req.token,
      window: 2,
    });

    if (!verified) {
      // Check backup codes
      const backupCodeMatch = user.backupCodes?.includes(req.token);
      if (backupCodeMatch) {
        // Remove used backup code
        const updatedCodes = user.backupCodes!.filter(
          (code) => code !== req.token
        );
        await this.userRepo.update(user.id, { backupCodes: updatedCodes });
        return Result.ok({ verified: true });
      }
      return Result.fail("Invalid 2FA token");
    }

    // Enable 2FA on first successful verification
    if (!user.twoFactorEnabled) {
      await this.userRepo.update(user.id, { twoFactorEnabled: true });
    }

    return Result.ok({ verified: true });
  }
}
