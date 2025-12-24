import { IEmailService } from "./IEmailService";
import { Logger } from "../logger/logger";

export class MockEmailService implements IEmailService {
  async sendVerificationEmail(
    to: string,
    token: string,
    name: string
  ): Promise<void> {
    Logger.info("📧 Mock: Sending verification email", {
      to,
      token,
      name,
      verificationUrl: `http://localhost:3000/verify?token=${token}`,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
    name: string
  ): Promise<void> {
    Logger.info("📧 Mock: Sending password reset email", {
      to,
      token,
      name,
      resetUrl: `http://localhost:3000/reset-password?token=${token}`,
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    Logger.info("📧 Mock: Sending welcome email", { to, name });
  }
}
