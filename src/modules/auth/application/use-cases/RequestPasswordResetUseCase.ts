import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { Email } from "@modules/auth/domain/value-objects/Email";
import { TokenService } from "@modules/auth/infrastructure/security/TokenService";
import { PasswordResetRequestDto } from "../dtos/AuthRequestDtos";

export class RequestPasswordResetUseCase
  implements UseCase<PasswordResetRequestDto, Result<void>>
{
  constructor(private userRepository: IUserRepository) {}

  async execute(request: PasswordResetRequestDto): Promise<Result<void>> {
    const emailOrError = Email.create(request.email);
    if (emailOrError.isFailure) {
      return Result.fail<void>(emailOrError.error!);
    }

    const email = emailOrError.getValue();
    const user = await this.userRepository.findByEmail(email);

    // Don't reveal if user exists or not
    if (!user) {
      return Result.ok<void>();
    }

    const resetToken = TokenService.generateResetToken(user.id);
    // TODO: Send email with reset token

    return Result.ok<void>();
  }
}
