import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRoleRepository } from "@modules/auth/domain/repositories/IUserRoleRepository";

export class RemoveRoleUseCase implements UseCase<string, Result<void>> {
  constructor(private userRoleRepository: IUserRoleRepository) {}

  async execute(userId: string): Promise<Result<void>> {
    const userRole = await this.userRoleRepository.findByUserId(userId);

    if (!userRole) {
      return Result.fail<void>("User role not found");
    }

    await this.userRoleRepository.delete(userRole.id);
    return Result.ok<void>();
  }
}
