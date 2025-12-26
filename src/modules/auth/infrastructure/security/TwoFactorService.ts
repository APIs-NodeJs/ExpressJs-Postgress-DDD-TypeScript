import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";

export class TwoFactorService {
  generateSecret(email: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `YourApp (${email})`,
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || "",
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return await qrcode.toDataURL(otpauthUrl);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2,
    });
  }
}
