import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRoleRepository } from "@modules/auth/domain/repositories/IUserRoleRepository";
import { UserRoleDto } from "../dtos/RoleDtos";

export class GetUserRoleUseCase
  implements UseCase<string, Result<UserRoleDto | null>>
{
  constructor(private userRoleRepository: IUserRoleRepository) {}

  async execute(userId: string): Promise<Result<UserRoleDto | null>> {
    const userRole = await this.userRoleRepository.findByUserId(userId);

    if (!userRole) {
      return Result.ok<UserRoleDto | null>(null);
    }

    const dto: UserRoleDto = {
      id: userRole.id,
      userId: userRole.userId,
      role: userRole.role.value,
      createdAt: userRole.createdAt.toISOString(),
      updatedAt: userRole.updatedAt.toISOString(),
    };

    return Result.ok<UserRoleDto | null>(dto);
  }
}
