import { UseCase } from '../../../../shared/application/UseCase';
import { Result } from '../../../../shared/application/Result';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { Logger } from '../../../../shared/infrastructure/logger/logger';

export interface Enable2FARequest {
  userId: string;
}

export interface Enable2FAResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class Enable2FAUseCase implements UseCase<Enable2FARequest, Enable2FAResponse> {
  constructor(private userRepo: UserRepository) {}

  async execute(req: Enable2FARequest): Promise<Result<Enable2FAResponse>> {
    try {
      const user = await this.userRepo.findById(req.userId);
      if (!user) {
        return Result.fail('User not found');
      }

      // Generate secret
      const secret = authenticator.generateSecret();

      // Generate OTP auth URL
      const otpauth = authenticator.keyuri(
        user.email,
        'Devcycle',
        secret
      );

      // Generate QR code
      const qrCode = await QRCode.toDataURL(otpauth);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store secret and backup codes (hashed) in database
      await this.userRepo.update(req.userId, {
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes.map(code => 
          require('crypto').createHash('sha256').update(code).digest('hex')
        ),
        twoFactorEnabled: false, // Not enabled until verified
      });

      Logger.info('2FA setup initiated', { userId: req.userId });

      return Result.ok({
        secret,
        qrCode,
        backupCodes,
      });
    } catch (error) {
      Logger.error('Failed to enable 2FA', error, { userId: req.userId });
      return Result.fail('Failed to enable 2FA');
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}