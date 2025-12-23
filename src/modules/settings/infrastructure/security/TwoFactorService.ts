import * as crypto from "crypto";

export class TwoFactorService {
  /**
   * Generate a secret for TOTP (Time-based One-Time Password)
   */
  static generateSecret(): string {
    return crypto.randomBytes(20).toString("hex");
  }

  /**
   * Generate backup codes for account recovery
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  static generateQRCodeUrl(
    secret: string,
    email: string,
    issuer: string = "DevCycle"
  ): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    const otpauthUrl = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}`;

    // In production, you'd use a proper QR code library
    // For now, we'll use a QR code generation service
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      otpauthUrl
    )}`;
  }

  /**
   * Verify a TOTP code
   * In production, use a library like 'otplib' for proper TOTP verification
   */
  static verifyCode(secret: string, code: string): boolean {
    // This is a simplified implementation
    // In production, use a proper TOTP library like 'otplib' or 'speakeasy'

    // For demo purposes, we'll accept any 6-digit code
    // In real implementation, this would verify against time-based algorithm
    const isValidFormat = /^\d{6}$/.test(code);

    if (!isValidFormat) {
      return false;
    }

    // In production: use proper TOTP verification
    // const totp = new TOTP({ secret });
    // return totp.verify({ token: code, window: 1 });

    // For demo: accept any 6-digit code
    return true;
  }

  /**
   * Verify a backup code
   */
  static verifyBackupCode(
    backupCodes: string[],
    providedCode: string
  ): { valid: boolean; remainingCodes?: string[] } {
    const normalizedCode = providedCode.toUpperCase().replace(/\s/g, "");
    const index = backupCodes.indexOf(normalizedCode);

    if (index === -1) {
      return { valid: false };
    }

    // Remove used backup code
    const remainingCodes = [...backupCodes];
    remainingCodes.splice(index, 1);

    return {
      valid: true,
      remainingCodes,
    };
  }

  /**
   * Hash a backup code for secure storage
   */
  static hashBackupCode(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex");
  }
}
