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
      const user = await this.userRepo.findByEmail(req.email);

      if (!user) {
        // Don't reveal if email exists
        return Result.ok({
          message: "If the email exists, a verification link has been sent",
        });
      }

      if (user.emailVerified) {
        return Result.fail("Email is already verified");
      }

      // Generate new token
      const token = randomBytes(32).toString("hex");
      const expires = new Date();
      expires.setHours(expires.getHours() + 24); // 24 hours

      // Update user
      await this.userRepo.update(user.id, {
        verificationToken: token,
        verificationTokenExpires: expires,
      });

      // Send email
      await this.emailService.sendVerificationEmail(
        user.email,
        token,
        user.name
      );

      Logger.info("Verification email resent", {
        userId: user.id,
        email: user.email,
      });

      return Result.ok({
        message: "Verification email sent",
      });
    } catch (error) {
      Logger.error("Failed to resend verification email", error);
      return Result.fail("Failed to send verification email");
    }
  }
}
