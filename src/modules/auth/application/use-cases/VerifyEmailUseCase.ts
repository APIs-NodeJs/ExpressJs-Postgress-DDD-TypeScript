import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { Logger } from "../../../../shared/infrastructure/logger/logger";

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

@injectable()
export class VerifyEmailUseCase implements UseCase<
  VerifyEmailRequest,
  VerifyEmailResponse
> {
  constructor(
    @inject(TOKENS.IUserRepository) private userRepo: IUserRepository
  ) {}

  async execute(req: VerifyEmailRequest): Promise<Result<VerifyEmailResponse>> {
    try {
      // Find user by verification token
      const users = await this.userRepo.findAll();
      const user = users.find((u) => u.verificationToken === req.token);

      if (!user) {
        return Result.fail("Invalid or expired verification token");
      }

      // Check if token is expired
      if (
        user.verificationTokenExpires &&
        user.verificationTokenExpires < new Date()
      ) {
        return Result.fail("Verification token has expired");
      }

      // Check if already verified
      if (user.emailVerified) {
        return Result.fail("Email already verified");
      }

      // Update user
      await this.userRepo.update(user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      });

      Logger.info("Email verified successfully", {
        userId: user.id,
        email: user.email,
      });

      return Result.ok({
        message: "Email verified successfully",
      });
    } catch (error) {
      Logger.error("Email verification failed", error);
      return Result.fail("Failed to verify email");
    }
  }
}
