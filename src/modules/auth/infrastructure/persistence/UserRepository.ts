import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/aggregates/User.aggregate";
import { Email } from "../../domain/value-objects/Email.vo";
import { UserModel } from "./models/UserModel";
import { UserMapper } from "./mappers/UserMapper";
import { UnitOfWork } from "../../../../core/infrastructure/persistence/UnitOfWork";
import { Op } from "sequelize";

export class UserRepository implements IUserRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async findById(
    id: string,
    includeDeleted: boolean = false
  ): Promise<User | null> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const whereClause: any = { id };

    // By default, exclude soft-deleted users
    if (!includeDeleted) {
      whereClause.deletedAt = null;
    }

    const userModel = await UserModel.findOne({
      where: whereClause,
      transaction,
    });

    if (!userModel) {
      return null;
    }

    return UserMapper.toDomain(userModel);
  }

  async findByEmail(
    email: Email,
    includeDeleted: boolean = false
  ): Promise<User | null> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const whereClause: any = { email: email.value };

    // By default, exclude soft-deleted users
    if (!includeDeleted) {
      whereClause.deletedAt = null;
    }

    const userModel = await UserModel.findOne({
      where: whereClause,
      transaction,
    });

    if (!userModel) {
      return null;
    }

    return UserMapper.toDomain(userModel);
  }

  async findByWorkspaceId(
    workspaceId: string,
    includeDeleted: boolean = false
  ): Promise<User[]> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const whereClause: any = { workspaceId };

    // By default, exclude soft-deleted users
    if (!includeDeleted) {
      whereClause.deletedAt = null;
    }

    const userModels = await UserModel.findAll({
      where: whereClause,
      transaction,
    });

    return userModels.map((model) => UserMapper.toDomain(model));
  }

  async existsByEmail(
    email: Email,
    includeDeleted: boolean = false
  ): Promise<boolean> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const whereClause: any = { email: email.value };

    // By default, exclude soft-deleted users
    if (!includeDeleted) {
      whereClause.deletedAt = null;
    }

    const count = await UserModel.count({
      where: whereClause,
      transaction,
    });

    return count > 0;
  }

  async save(user: User): Promise<void> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const persistenceData = UserMapper.toPersistence(user);

    const existingUser = await UserModel.findByPk(user.id, { transaction });

    if (existingUser) {
      await existingUser.update(persistenceData, { transaction });
    } else {
      await UserModel.create(persistenceData as any, { transaction });
    }
  }

  // Hard delete - removes from database permanently
  async delete(id: string): Promise<void> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    await UserModel.destroy({
      where: { id },
      transaction,
    });
  }

  // NEW: Soft delete - marks as deleted but keeps in database
  async softDelete(id: string, deletedBy?: string): Promise<void> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    await UserModel.update(
      {
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
        status: "DELETED",
      },
      {
        where: { id },
        transaction,
      }
    );
  }

  // NEW: Restore soft-deleted user
  async restore(id: string): Promise<void> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    await UserModel.update(
      {
        deletedAt: null,
        deletedBy: null,
        status: "ACTIVE",
      },
      {
        where: { id },
        transaction,
      }
    );
  }

  // NEW: Find all deleted users (for admin)
  async findDeleted(limit: number = 50, offset: number = 0): Promise<User[]> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const userModels = await UserModel.findAll({
      where: {
        deletedAt: {
          [Op.ne]: null,
        },
      },
      limit,
      offset,
      order: [["deletedAt", "DESC"]],
      transaction,
    });

    return userModels.map((model) => UserMapper.toDomain(model));
  }

  // NEW: Count deleted users
  async countDeleted(): Promise<number> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    return await UserModel.count({
      where: {
        deletedAt: {
          [Op.ne]: null,
        },
      },
      transaction,
    });
  }

  // NEW: Permanently delete old soft-deleted users (cleanup job)
  async permanentlyDeleteOldUsers(olderThanDays: number = 30): Promise<number> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deleted = await UserModel.destroy({
      where: {
        deletedAt: {
          [Op.lt]: cutoffDate,
        },
      },
      transaction,
    });

    return deleted;
  }

  // NEW: Find users by status
  async findByStatus(
    status: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<User[]> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const userModels = await UserModel.findAll({
      where: {
        status,
        deletedAt: null, // Exclude soft-deleted
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      transaction,
    });

    return userModels.map((model) => UserMapper.toDomain(model));
  }

  // NEW: Search users by email pattern
  async searchByEmail(
    emailPattern: string,
    limit: number = 20
  ): Promise<User[]> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const userModels = await UserModel.findAll({
      where: {
        email: {
          [Op.iLike]: `%${emailPattern}%`, // Case-insensitive search
        },
        deletedAt: null,
      },
      limit,
      order: [["email", "ASC"]],
      transaction,
    });

    return userModels.map((model) => UserMapper.toDomain(model));
  }

  // NEW: Count users by workspace
  async countByWorkspace(workspaceId: string): Promise<number> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    return await UserModel.count({
      where: {
        workspaceId,
        deletedAt: null,
      },
      transaction,
    });
  }

  // NEW: Find users created in date range
  async findByDateRange(startDate: Date, endDate: Date): Promise<User[]> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const userModels = await UserModel.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        deletedAt: null,
      },
      order: [["createdAt", "DESC"]],
      transaction,
    });

    return userModels.map((model) => UserMapper.toDomain(model));
  }

  // NEW: Batch operations - useful for admin actions
  async batchUpdate(
    userIds: string[],
    updates: Partial<{ status: string; emailVerified: boolean }>
  ): Promise<number> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const [affectedRows] = await UserModel.update(updates, {
      where: {
        id: {
          [Op.in]: userIds,
        },
      },
      transaction,
    });

    return affectedRows;
  }
}
