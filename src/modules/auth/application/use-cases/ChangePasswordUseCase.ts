import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { Password } from "@modules/auth/domain/value-objects/Password";
import { PasswordHasher } from "@modules/auth/infrastructure/security/PasswordHasher";
import { ChangePasswordRequest } from "../dtos/AuthRequestDtos";

interface ChangePasswordInput {
  userId: string;
  data: ChangePasswordRequest;
}

export class ChangePasswordUseCase
  implements UseCase<ChangePasswordInput, Result<void>>
{
  constructor(private userRepository: IUserRepository) {}

  async execute(input: ChangePasswordInput): Promise<Result<void>> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      return Result.fail<void>("User not found");
    }

    // Verify current password
    const passwordMatch = await PasswordHasher.compare(
      input.data.currentPassword,
      user.password.value
    );

    if (!passwordMatch) {
      return Result.fail<void>("Current password is incorrect");
    }

    // Validate new password
    const newPasswordOrError = Password.create(input.data.newPassword);
    if (newPasswordOrError.isFailure) {
      return Result.fail<void>(newPasswordOrError.error!);
    }

    // Hash new password
    const hashedPassword = await PasswordHasher.hash(input.data.newPassword);
    const hashedPasswordOrError = Password.createHashed(hashedPassword);
    if (hashedPasswordOrError.isFailure) {
      return Result.fail<void>("Error processing password");
    }

    // Update password
    user.updatePassword(hashedPasswordOrError.getValue());
    await this.userRepository.save(user);

    return Result.ok<void>();
  }
}
