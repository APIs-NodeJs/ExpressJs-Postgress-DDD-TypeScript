import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IEmailService } from "../../../../shared/infrastructure/email/IEmailService";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { Logger } from "../../../../shared/infrastructure/logger/logger";
import { randomBytes } from "crypto";

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

@injectable()
export class ResendVerificationUseCase implements UseCase<
  ResendVerificationRequest,
  ResendVerificationResponse
> {
  constructor(
    @inject(TOKENS.IUserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.IEmailService) private emailService: IEmailService
  ) {}

  async execute(
    req: ResendVerificationRequest
  ): Promise<Result<ResendVerificationResponse>> {
    try {
      // Normalize email
      const normalizedEmail = req.email.toLowerCase().trim();

      const user = await this.userRepo.findByEmail(normalizedEmail);

      // Always return success to prevent email enumeration
      if (!user) {
        Logger.info("Verification email requested for non-existent email", {
          email: normalizedEmail,
        });
        
        // Add artificial delay to prevent timing attacks
        await this.artificialDelay();
        
        return Result.ok({
          message:
            "If the email exists and is not verified, a verification link has been sent.",
        });
      }

      // Check if email is already verified
      const userWithVerification = user as any;
      if (userWithVerification.emailVerified === true) {
        Logger.info("Verification email requested for already verified user", {
          userId: user.id,
          email: user.email,
        });
        
        return Result.fail(
          "This email address is already verified. You can log in to your account."
        );
      }

      // Generate new verification token
      const token = randomBytes(32).toString("hex");
      
      // Set expiration time (24 hours from now)
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);

      // Update user with new verification token
      await this.userRepo.update(user.id, {
        verificationToken: token,
        verificationTokenExpires: expires,
      } as any);

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail(
          user.email,
          token,
          user.name
        );
        
        Logger.info("Verification email resent", {
          userId: user.id,
          email: user.email,
          tokenExpires: expires,
        });
      } catch (emailError) {
        // Log email error but don't expose it to user
        Logger.error("Failed to send verification email", emailError, {
          userId: user.id,
          email: user.email,
        });
        
        // Clean up the token if email fails
        await this.userRepo.update(user.id, {
          verificationToken: null,
          verificationTokenExpires: null,
        } as any);
        
        return Result.fail(
          "Failed to send verification email. Please try again later."
        );
      }

      return Result.ok({
        message:
          "If the email exists and is not verified, a verification link has been sent.",
      });
    } catch (error) {
      Logger.error("Resend verification request failed", error, {
        email: req.email,
      });
      
      return Result.fail(
        "Failed to send verification email. Please try again later."
      );
    }
  }

  /**
   * Add artificial delay to prevent timing attacks
   * Makes it harder to determine if an email exists by measuring response time
   */
  private async artificialDelay(): Promise<void> {
    // Random delay between 100-300ms
    const delay = 100 + Math.random() * 200;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}