import { Transaction } from "sequelize";
import { UserModel } from "../../../../infrastructure/database/models/UserModel";
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { Logger } from "../../../../shared/infrastructure/logger/logger";
import { AppError } from "../../../../shared/domain/AppError";

/**
 * User Repository Implementation using Sequelize
 */
export class UserRepository implements IUserRepository {
  /**
   * Find user by email (case-insensitive)
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const model = await UserModel.findOne({
        where: { email: email.toLowerCase() },
      });
      return model ? this.toDomain(model) : null;
    } catch (error) {
      Logger.error("Failed to find user by email", error, { email });
      throw AppError.databaseError("Failed to retrieve user");
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const model = await UserModel.findByPk(id);
      return model ? this.toDomain(model) : null;
    } catch (error) {
      Logger.error("Failed to find user by ID", error, { userId: id });
      throw AppError.databaseError("Failed to retrieve user");
    }
  }

  /**
   * Find all users in a workspace
   */
  async findByWorkspaceId(workspaceId: string): Promise<User[]> {
    try {
      const models = await UserModel.findAll({
        where: { workspaceId },
        order: [["created_at", "DESC"]],
      });
      return models.map((model) => this.toDomain(model));
    } catch (error) {
      Logger.error("Failed to find users by workspace", error, { workspaceId });
      throw AppError.databaseError("Failed to retrieve workspace users");
    }
  }

  /**
   * Find all users (admin function)
   */
  async findAll(): Promise<User[]> {
    try {
      const models = await UserModel.findAll({
        order: [["created_at", "DESC"]],
      });
      return models.map((model) => this.toDomain(model));
    } catch (error) {
      Logger.error("Failed to find all users", error);
      throw AppError.databaseError("Failed to retrieve users");
    }
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<User | null> {
    try {
      const model = await UserModel.findOne({
        where: { verificationToken: token },
      });
      return model ? this.toDomain(model) : null;
    } catch (error) {
      Logger.error("Failed to find user by verification token", error);
      throw AppError.databaseError("Failed to retrieve user");
    }
  }

  /**
   * Find user by password reset token
   */
  async findByResetToken(token: string): Promise<User | null> {
    try {
      const model = await UserModel.findOne({
        where: { resetToken: token },
      });
      return model ? this.toDomain(model) : null;
    } catch (error) {
      Logger.error("Failed to find user by reset token", error);
      throw AppError.databaseError("Failed to retrieve user");
    }
  }

  /**
   * Create a new user
   */
  async create(user: User, transaction?: Transaction): Promise<User> {
    try {
      const model = await UserModel.create(
        {
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          workspaceId: user.workspaceId,
          emailVerified: user.emailVerified,
          verificationToken: user.verificationToken,
          verificationTokenExpires: user.verificationTokenExpires,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorSecret: user.twoFactorSecret,
          backupCodes: user.backupCodes,
        },
        { transaction }
      );

      Logger.info("User created", { userId: model.id, email: model.email });
      return this.toDomain(model);
    } catch (error) {
      Logger.error("Failed to create user", error, {
        email: user.email,
        workspaceId: user.workspaceId,
      });
      throw AppError.databaseError("Failed to create user");
    }
  }

  /**
   * Update existing user
   */
  async update(
    id: string,
    updates: Partial<User>,
    transaction?: Transaction
  ): Promise<User | null> {
    try {
      const [affectedCount] = await UserModel.update(updates, {
        where: { id },
        transaction,
      });

      if (affectedCount === 0) {
        Logger.warn("User not found for update", { userId: id });
        return null;
      }

      Logger.info("User updated", { userId: id });
      return this.findById(id);
    } catch (error) {
      Logger.error("Failed to update user", error, { userId: id });
      throw AppError.databaseError("Failed to update user");
    }
  }

  /**
   * Delete user
   */
  async delete(id: string, transaction?: Transaction): Promise<boolean> {
    try {
      const deletedCount = await UserModel.destroy({
        where: { id },
        transaction,
      });

      const success = deletedCount > 0;

      if (success) {
        Logger.info("User deleted", { userId: id });
      } else {
        Logger.warn("User not found for deletion", { userId: id });
      }

      return success;
    } catch (error) {
      Logger.error("Failed to delete user", error, { userId: id });
      throw AppError.databaseError("Failed to delete user");
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const count = await UserModel.count({
        where: { email: email.toLowerCase() },
      });
      return count > 0;
    } catch (error) {
      Logger.error("Failed to check email existence", error, { email });
      throw AppError.databaseError("Failed to check email");
    }
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    try {
      return await UserModel.count();
    } catch (error) {
      Logger.error("Failed to count users", error);
      throw AppError.databaseError("Failed to count users");
    }
  }

  /**
   * Count users in workspace
   */
  async countByWorkspace(workspaceId: string): Promise<number> {
    try {
      return await UserModel.count({
        where: { workspaceId },
      });
    } catch (error) {
      Logger.error("Failed to count workspace users", error, { workspaceId });
      throw AppError.databaseError("Failed to count workspace users");
    }
  }

  /**
   * Convert database model to domain entity
   */
  private toDomain(model: UserModel): User {
    return User.fromPersistence({
      id: model.id,
      email: model.email,
      password: model.password,
      name: model.name,
      role: model.role,
      workspaceId: model.workspaceId,
      emailVerified: (model as any).emailVerified ?? false,
      verificationToken: (model as any).verificationToken ?? null,
      verificationTokenExpires: (model as any).verificationTokenExpires ?? null,
      resetToken: (model as any).resetToken ?? null,
      resetTokenExpires: (model as any).resetTokenExpires ?? null,
      twoFactorEnabled: (model as any).twoFactorEnabled ?? false,
      twoFactorSecret: (model as any).twoFactorSecret ?? null,
      backupCodes: (model as any).backupCodes ?? null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
