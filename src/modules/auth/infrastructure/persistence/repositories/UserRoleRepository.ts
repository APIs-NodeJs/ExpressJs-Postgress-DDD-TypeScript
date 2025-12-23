import { BaseRepository } from "@shared/infrastructure/BaseRepository";
import { IUserRoleRepository } from "@modules/auth/domain/repositories/IUserRoleRepository";
import { UserRole } from "@modules/auth/domain/entities/UserRole";
import {
  AppRole,
  AppRoleType,
} from "@modules/auth/domain/value-objects/AppRole";
import { UserRoleModel } from "../models/UserRoleModel";

export class UserRoleRepository
  extends BaseRepository<UserRole, UserRoleModel>
  implements IUserRoleRepository
{
  constructor() {
    super(UserRoleModel);
  }

  protected toDomain(model: UserRoleModel): UserRole {
    const roleOrError = AppRole.create(model.role);

    if (roleOrError.isFailure) {
      throw new Error("Invalid role data from database");
    }

    const userRole = UserRole.create(
      {
        userId: model.userId,
        role: roleOrError.getValue(),
      },
      model.id
    );

    // Restore timestamps
    (userRole as any).props.createdAt = model.createdAt;
    (userRole as any).props.updatedAt = model.updatedAt;

    return userRole;
  }

  protected toModel(domain: UserRole): Partial<UserRoleModel> {
    return {
      id: domain.id,
      userId: domain.userId,
      role: domain.role.value,
    };
  }

  async findByUserId(userId: string): Promise<UserRole | null> {
    const model = await this.model.findOne({
      where: { userId },
      order: [
        [
          "role",
          // Admin first, then moderator, then user
          "ASC",
        ],
      ],
    });
    return model ? this.toDomain(model) : null;
  }

  async findByRole(role: AppRoleType): Promise<UserRole[]> {
    const models = await this.model.findAll({
      where: { role },
      order: [["createdAt", "DESC"]],
    });
    return models.map((model) => this.toDomain(model));
  }

  async hasRole(userId: string, role: AppRoleType): Promise<boolean> {
    const count = await this.model.count({
      where: { userId, role },
    });
    return count > 0;
  }

  async exists(userId: string): Promise<boolean> {
    const count = await this.model.count({
      where: { userId },
    });
    return count > 0;
  }
}
