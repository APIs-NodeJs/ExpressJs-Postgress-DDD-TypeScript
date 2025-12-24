import { injectable, inject } from "tsyringe";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { randomBytes } from "crypto";

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
    const user = await this.userRepo.findById(req.userId);
    if (!user) return Result.fail("User not found");

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Devcycle (${user.email})`,
      issuer: "Devcycle",
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      randomBytes(4).toString("hex").toUpperCase()
    );

    // Save to database
    await this.userRepo.update(user.id, {
      twoFactorSecret: secret.base32,
      backupCodes: backupCodes,
      twoFactorEnabled: false, // Will be enabled after verification
    });

    return Result.ok({
      secret: secret.base32,
      qrCode,
      backupCodes,
    });
  }
}
