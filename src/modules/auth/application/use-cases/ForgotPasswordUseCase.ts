import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IEmailService } from "../../../../shared/infrastructure/email/IEmailService";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { Logger } from "../../../../shared/infrastructure/logger/Logger";
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
      const user = await this.userRepo.findByEmail(req.email);

      // Always return success to prevent email enumeration
      if (!user) {
        return Result.ok({
          message: "If the email exists, a password reset link has been sent",
        });
      }

      // Generate reset token
      const token = randomBytes(32).toString("hex");
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // 1 hour

      // Update user
      await this.userRepo.update(user.id, {
        resetToken: token,
        resetTokenExpires: expires,
      });

      // Send email
      await this.emailService.sendPasswordResetEmail(
        user.email,
        token,
        user.name
      );

      Logger.info("Password reset email sent", {
        userId: user.id,
        email: user.email,
      });

      return Result.ok({
        message: "Password reset link sent to your email",
      });
    } catch (error) {
      Logger.error("Failed to send password reset email", error);
      return Result.fail("Failed to process password reset request");
    }
  }
}
