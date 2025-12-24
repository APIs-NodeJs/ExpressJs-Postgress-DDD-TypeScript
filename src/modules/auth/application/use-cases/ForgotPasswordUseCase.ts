import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IEmailService } from "../../../../shared/infrastructure/email/IEmailService";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { Logger } from "../../../../shared/infrastructure/logger/logger";
import { randomBytes } from "crypto";

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

@injectable()
export class ForgotPasswordUseCase implements UseCase<
  ForgotPasswordRequest,
  ForgotPasswordResponse
> {
  constructor(
    @inject(TOKENS.IUserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.IEmailService) private emailService: IEmailService
  ) {}

  async execute(
    req: ForgotPasswordRequest
  ): Promise<Result<ForgotPasswordResponse>> {
    try {
      // Normalize email
      const normalizedEmail = req.email.toLowerCase().trim();

      const user = await this.userRepo.findByEmail(normalizedEmail);

      // Always return success to prevent email enumeration attacks
      // Don't reveal whether the email exists or not
      if (!user) {
        Logger.info("Password reset requested for non-existent email", {
          email: normalizedEmail,
        });
        
        // Add artificial delay to prevent timing attacks
        await this.artificialDelay();
        
        return Result.ok({
          message:
            "If an account exists with this email, a password reset link has been sent.",
        });
      }

      // Generate cryptographically secure reset token
      const token = randomBytes(32).toString("hex");
      
      // Set expiration time (1 hour from now)
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);

      // Update user with reset token and expiration
      await this.userRepo.update(user.id, {
        resetToken: token,
        resetTokenExpires: expires,
      } as any);

      // Send password reset email
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          token,
          user.name
        );
        
        Logger.info("Password reset email sent", {
          userId: user.id,
          email: user.email,
          tokenExpires: expires,
        });
      } catch (emailError) {
        // Log email error but don't expose it to user
        Logger.error("Failed to send password reset email", emailError, {
          userId: user.id,
          email: user.email,
        });
        
        // Clean up the token if email fails
        await this.userRepo.update(user.id, {
          resetToken: null,
          resetTokenExpires: null,
        } as any);
        
        // Return generic error
        return Result.fail(
          "Failed to send password reset email. Please try again later."
        );
      }

      return Result.ok({
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    } catch (error) {
      Logger.error("Forgot password request failed", error, {
        email: req.email,
      });
      
      return Result.fail(
        "Failed to process password reset request. Please try again later."
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