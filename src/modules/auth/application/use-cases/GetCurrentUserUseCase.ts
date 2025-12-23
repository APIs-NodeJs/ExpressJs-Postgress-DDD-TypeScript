import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { IUserRoleRepository } from "@modules/auth/domain/repositories/IUserRoleRepository";
import { UserWithRoleDto } from "../dtos/RoleDtos";
import { getUserPermissions } from "@modules/auth/presentation/middlewares/permissions";

export class GetCurrentUserUseCase
  implements UseCase<string, Result<UserWithRoleDto>>
{
  constructor(
    private userRepository: IUserRepository,
    private userRoleRepository: IUserRoleRepository
  ) {}

  async execute(userId: string): Promise<Result<UserWithRoleDto>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.fail<UserWithRoleDto>("User not found");
    }

    // Get user role - if no role exists, default to 'user' role
    const userRole = await this.userRoleRepository.findByUserId(userId);
    const role = userRole ? userRole.role.value : "user";

    const response: UserWithRoleDto = {
      id: user.id,
      email: user.email.value,
      name: user.name,
      avatar: user.avatar,
      role,
      permissions: getUserPermissions(role),
      emailVerified: user.emailVerified,
      workspaceId: user.workspaceId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return Result.ok<UserWithRoleDto>(response);
  }
}
