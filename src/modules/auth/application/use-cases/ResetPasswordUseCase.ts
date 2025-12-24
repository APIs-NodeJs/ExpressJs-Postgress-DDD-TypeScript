import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { Logger } from "../../../../shared/infrastructure/logger/Logger";

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

@injectable()
export class ResetPasswordUseCase implements UseCase<
  ResetPasswordRequest,
  ResetPasswordResponse
> {
  constructor(
    @inject(TOKENS.IUserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.IPasswordHasher) private passwordHasher: IPasswordHasher
  ) {}

  async execute(
    req: ResetPasswordRequest
  ): Promise<Result<ResetPasswordResponse>> {
    try {
      // Find user by reset token
      const users = await this.userRepo.findAll();
      const user = users.find((u) => u.resetToken === req.token);

      if (!user) {
        return Result.fail("Invalid or expired reset token");
      }

      // Check if token is expired
      if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
        return Result.fail("Reset token has expired");
      }

      // Hash new password
      const hashedPassword = await this.passwordHasher.hash(req.newPassword);

      // Update user
      await this.userRepo.update(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      });

      Logger.info("Password reset successfully", {
        userId: user.id,
        email: user.email,
      });

      return Result.ok({
        message: "Password reset successfully",
      });
    } catch (error) {
      Logger.error("Password reset failed", error);
      return Result.fail("Failed to reset password");
    }
  }
}
