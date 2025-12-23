import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { Password } from "@modules/auth/domain/value-objects/Password";
import { PasswordHasher } from "@modules/auth/infrastructure/security/PasswordHasher";
import { TokenService } from "@modules/auth/infrastructure/security/TokenService";
import { ResetPasswordRequest } from "../dtos/AuthRequestDtos";

export class ResetPasswordUseCase
  implements UseCase<ResetPasswordRequest, Result<void>>
{
  constructor(private userRepository: IUserRepository) {}

  async execute(request: ResetPasswordRequest): Promise<Result<void>> {
    const userId = TokenService.verifyResetToken(request.token);

    if (!userId) {
      return Result.fail<void>("Invalid or expired reset token");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail<void>("User not found");
    }

    // Validate new password
    const newPasswordOrError = Password.create(request.newPassword);
    if (newPasswordOrError.isFailure) {
      return Result.fail<void>(newPasswordOrError.error!);
    }

    // Hash new password
    const hashedPassword = await PasswordHasher.hash(request.newPassword);
    const hashedPasswordOrError = Password.createHashed(hashedPassword);
    if (hashedPasswordOrError.isFailure) {
      return Result.fail<void>("Error processing password");
    }

    // Update password
    user.updatePassword(hashedPasswordOrError.getValue());
    await this.userRepository.save(user);

    // Invalidate token
    TokenService.invalidateResetToken(request.token);

    return Result.ok<void>();
  }
}
