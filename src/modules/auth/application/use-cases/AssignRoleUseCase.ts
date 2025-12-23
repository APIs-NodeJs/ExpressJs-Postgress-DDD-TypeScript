import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRoleRepository } from "@modules/auth/domain/repositories/IUserRoleRepository";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { UserRole } from "@modules/auth/domain/entities/UserRole";
import { AppRole } from "@modules/auth/domain/value-objects/AppRole";
import { AssignRoleRequest, UserRoleDto } from "../dtos/RoleDtos";

export class AssignRoleUseCase
  implements UseCase<AssignRoleRequest, Result<UserRoleDto>>
{
  constructor(
    private userRoleRepository: IUserRoleRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(request: AssignRoleRequest): Promise<Result<UserRoleDto>> {
    // Check if user exists
    const userExists = await this.userRepository.exists(request.userId);
    if (!userExists) {
      return Result.fail<UserRoleDto>("User not found");
    }

    // Validate role
    const roleOrError = AppRole.create(request.role);
    if (roleOrError.isFailure) {
      return Result.fail<UserRoleDto>(roleOrError.error!);
    }

    const role = roleOrError.getValue();

    // Check if user already has a role
    const existingRole = await this.userRoleRepository.findByUserId(
      request.userId
    );

    let savedUserRole: UserRole;

    if (existingRole) {
      // Update existing role
      existingRole.updateRole(role);
      savedUserRole = await this.userRoleRepository.save(existingRole);
    } else {
      // Create new role
      const userRole = UserRole.create({
        userId: request.userId,
        role,
      });
      savedUserRole = await this.userRoleRepository.save(userRole);
    }

    const dto: UserRoleDto = {
      id: savedUserRole.id,
      userId: savedUserRole.userId,
      role: savedUserRole.role.value,
      createdAt: savedUserRole.createdAt.toISOString(),
      updatedAt: savedUserRole.updatedAt.toISOString(),
    };

    return Result.ok<UserRoleDto>(dto);
  }
}
