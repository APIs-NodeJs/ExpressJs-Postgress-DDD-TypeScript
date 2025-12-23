import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { UpdateProfileRequest } from "../dtos/AuthRequestDtos";
import { AuthUserDto } from "../dtos/AuthResponseDtos";

interface UpdateProfileInput {
  userId: string;
  data: UpdateProfileRequest;
}

export class UpdateProfileUseCase
  implements UseCase<UpdateProfileInput, Result<AuthUserDto>>
{
  constructor(private userRepository: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<Result<AuthUserDto>> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      return Result.fail<AuthUserDto>("User not found");
    }

    if (input.data.name) {
      user.updateProfile(input.data.name, input.data.avatar);
    } else if (input.data.avatar) {
      user.updateProfile(user.name, input.data.avatar);
    }

    const updatedUser = await this.userRepository.save(user);

    const response: AuthUserDto = {
      id: updatedUser.id,
      email: updatedUser.email.value,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      emailVerified: updatedUser.emailVerified,
      workspaceId: updatedUser.workspaceId,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    return Result.ok<AuthUserDto>(response);
  }
}
