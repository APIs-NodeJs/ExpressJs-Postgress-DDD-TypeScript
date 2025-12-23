import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { Email } from "@modules/auth/domain/value-objects/Email";
import { PasswordHasher } from "@modules/auth/infrastructure/security/PasswordHasher";
import { JwtService } from "@modules/auth/infrastructure/security/JwtService";
import { LoginRequest } from "../dtos/AuthRequestDtos";
import { AuthResponseDto } from "../dtos/AuthResponseDtos";

export class LoginUseCase
  implements UseCase<LoginRequest, Result<AuthResponseDto>>
{
  constructor(private userRepository: IUserRepository) {}

  async execute(request: LoginRequest): Promise<Result<AuthResponseDto>> {
    const emailOrError = Email.create(request.email);
    if (emailOrError.isFailure) {
      return Result.fail<AuthResponseDto>(emailOrError.error!);
    }

    const email = emailOrError.getValue();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return Result.fail<AuthResponseDto>("Invalid email or password");
    }

    const passwordMatch = await PasswordHasher.compare(
      request.password,
      user.password.value
    );

    if (!passwordMatch) {
      return Result.fail<AuthResponseDto>("Invalid email or password");
    }

    const tokens = JwtService.generateTokens({
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email.value,
    });

    const response: AuthResponseDto = {
      user: {
        id: user.id,
        email: user.email.value,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        workspaceId: user.workspaceId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tokens,
    };

    return Result.ok<AuthResponseDto>(response);
  }
}
