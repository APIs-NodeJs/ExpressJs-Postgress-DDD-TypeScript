import { v4 as uuidv4 } from "uuid";

interface TokenStore {
  [key: string]: {
    userId: string;
    expiresAt: Date;
  };
}

export class TokenService {
  private static resetTokens: TokenStore = {};
  private static verificationTokens: TokenStore = {};

  static generateResetToken(userId: string): string {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    this.resetTokens[token] = { userId, expiresAt };
    return token;
  }

  static verifyResetToken(token: string): string | null {
    const data = this.resetTokens[token];
    if (!data || data.expiresAt < new Date()) {
      delete this.resetTokens[token];
      return null;
    }
    return data.userId;
  }

  static invalidateResetToken(token: string): void {
    delete this.resetTokens[token];
  }

  static generateVerificationToken(userId: string): string {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    this.verificationTokens[token] = { userId, expiresAt };
    return token;
  }

  static verifyEmailToken(token: string): string | null {
    const data = this.verificationTokens[token];
    if (!data || data.expiresAt < new Date()) {
      delete this.verificationTokens[token];
      return null;
    }
    return data.userId;
  }

  static invalidateVerificationToken(token: string): void {
    delete this.verificationTokens[token];
  }
}
