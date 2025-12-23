import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRoleRepository } from "@modules/auth/domain/repositories/IUserRoleRepository";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { AppRoleType } from "@modules/auth/domain/value-objects/AppRole";
import { UserWithRoleDto } from "../dtos/RoleDtos";
import { getUserPermissions } from "@modules/auth/presentation/middlewares/permissions";

export class GetUsersByRoleUseCase
  implements UseCase<AppRoleType, Result<UserWithRoleDto[]>>
{
  constructor(
    private userRoleRepository: IUserRoleRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(role: AppRoleType): Promise<Result<UserWithRoleDto[]>> {
    const userRoles = await this.userRoleRepository.findByRole(role);

    const usersWithRoles: UserWithRoleDto[] = [];

    for (const userRole of userRoles) {
      const user = await this.userRepository.findById(userRole.userId);

      if (user) {
        usersWithRoles.push({
          id: user.id,
          email: user.email.value,
          name: user.name,
          avatar: user.avatar,
          role: userRole.role.value,
          permissions: getUserPermissions(userRole.role.value),
          emailVerified: user.emailVerified,
          workspaceId: user.workspaceId,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        });
      }
    }

    return Result.ok<UserWithRoleDto[]>(usersWithRoles);
  }
}
