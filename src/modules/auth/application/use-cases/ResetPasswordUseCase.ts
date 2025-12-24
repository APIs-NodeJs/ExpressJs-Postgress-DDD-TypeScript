import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { Logger } from "../../../../shared/infrastructure/logger/logger";

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
      // Validate password strength
      const passwordValidation = this.validatePassword(req.newPassword);
      if (!passwordValidation.isValid) {
        return Result.fail(passwordValidation.error!);
      }

      // Find user by reset token
      // Since we need to query by a field that's not indexed, we fetch by workspace
      // In production, you should add an index on reset_token or use a separate token store
      const allUsers = await this.userRepo.findAll();

      // Cast to access additional fields
      const user = allUsers.find((u) => {
        const userWithToken = u as any;
        return userWithToken.resetToken === req.token;
      });

      if (!user) {
        Logger.warn("Password reset attempted with invalid token", {
          token: req.token.substring(0, 8) + "...",
        });
        return Result.fail("Invalid or expired reset token");
      }

      // Check if token is expired
      const userWithToken = user as any;
      if (
        userWithToken.resetTokenExpires &&
        new Date(userWithToken.resetTokenExpires) < new Date()
      ) {
        Logger.warn("Password reset attempted with expired token", {
          userId: user.id,
          expiredAt: userWithToken.resetTokenExpires,
        });
        return Result.fail(
          "Reset token has expired. Please request a new one."
        );
      }

      // Hash new password
      const hashedPassword = await this.passwordHasher.hash(req.newPassword);

      // Update user with new password and clear reset token
      await this.userRepo.update(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      } as any);

      Logger.info("Password reset successfully", {
        userId: user.id,
        email: user.email,
      });

      return Result.ok({
        message:
          "Password has been reset successfully. You can now log in with your new password.",
      });
    } catch (error) {
      Logger.error("Password reset failed", error, {
        token: req.token.substring(0, 8) + "...",
      });
      return Result.fail("Failed to reset password. Please try again.");
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): {
    isValid: boolean;
    error?: string;
  } {
    if (password.length < 8) {
      return {
        isValid: false,
        error: "Password must be at least 8 characters long",
      };
    }

    if (password.length > 128) {
      return {
        isValid: false,
        error: "Password must not exceed 128 characters",
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one uppercase letter",
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one lowercase letter",
      };
    }

    if (!/\d/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one number",
      };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one special character",
      };
    }

    if (/\s/.test(password)) {
      return {
        isValid: false,
        error: "Password must not contain whitespace",
      };
    }

    return { isValid: true };
  }
}
