import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { Logger } from "../../../../shared/infrastructure/logger/logger";
import { createHash, randomBytes } from "crypto";

export interface Enable2FARequest {
  userId: string;
}

export interface Enable2FAResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

@injectable()
export class Enable2FAUseCase implements UseCase<
  Enable2FARequest,
  Enable2FAResponse
> {
  constructor(
    @inject(TOKENS.IUserRepository) private userRepo: IUserRepository
  ) {}

  async execute(req: Enable2FARequest): Promise<Result<Enable2FAResponse>> {
    try {
      const user = await this.userRepo.findById(req.userId);
      
      if (!user) {
        return Result.fail("User not found");
      }

      // Generate secret for TOTP
      const secret = authenticator.generateSecret();

      // Generate OTP auth URL for QR code
      const otpauth = authenticator.keyuri(
        user.email,
        "Devcycle API", // App name
        secret
      );

      // Generate QR code as data URL
      const qrCode = await QRCode.toDataURL(otpauth);

      // Generate backup codes (plain text for user)
      const backupCodes = this.generateBackupCodes(10);

      // Hash backup codes before storing
      const hashedBackupCodes = backupCodes.map(code =>
        createHash("sha256").update(code).digest("hex")
      );

      // Store secret and hashed backup codes
      await this.userRepo.update(req.userId, {
        twoFactorSecret: secret,
        backupCodes: hashedBackupCodes,
        twoFactorEnabled: false, // Not enabled until first successful verification
      } as any);

      Logger.info("2FA setup initiated", { 
        userId: req.userId,
        backupCodesGenerated: backupCodes.length 
      });

      // Return plain text backup codes to user (only time they'll see them)
      return Result.ok({
        secret,
        qrCode,
        backupCodes, // Plain text for user to save
      });
      
    } catch (error) {
      Logger.error("Failed to enable 2FA", error, { userId: req.userId });
      return Result.fail("Failed to enable 2FA");
    }
  }

  /**
   * Generate cryptographically secure backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8 random bytes and convert to alphanumeric
      const bytes = randomBytes(8);
      const code = bytes
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 8)
        .toUpperCase();
      
      codes.push(code);
    }
    
    return codes;
  }
}