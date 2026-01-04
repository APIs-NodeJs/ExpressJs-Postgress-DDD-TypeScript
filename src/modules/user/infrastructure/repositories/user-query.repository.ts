// src/modules/user/infrastructure/repositories/user-query.repository.ts

import {
  IUserQueryRepository,
  UserSearchCriteria,
} from '../../domain/repositories/user-query.repository.interface';
import { User } from '@modules/auth/domain/entities/user.entity';
import { UserModel } from '@modules/auth/infrastructure/models/user.model';
import { Email } from '@modules/auth/domain/value-objects/email.value-object';
import { UserStatus as UserStatusEnum } from '@modules/auth/domain/entities/user.entity';
import { PaginationDto } from '@core/dtos';
import { Op } from 'sequelize';

export class UserQueryRepository implements IUserQueryRepository {
  async findById(id: string): Promise<User | null> {
    const model = await UserModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const model = await UserModel.findOne({
      where: { email: email.toLowerCase() },
    });
    return model ? this.toDomain(model) : null;
  }

  async findAll(pagination: PaginationDto): Promise<{ users: User[]; total: number }> {
    const { rows, count } = await UserModel.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['created_at', 'DESC']],
      where: {
        deleted_at: null,
      },
    });

    return {
      users: rows.map((model) => this.toDomain(model)),
      total: count,
    };
  }

  async search(
    criteria: UserSearchCriteria,
    pagination: PaginationDto
  ): Promise<{ users: User[]; total: number }> {
    const where: any = {
      deleted_at: null,
    };

    // Search by email, first name, or last name
    if (criteria.search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${criteria.search}%` } },
        { first_name: { [Op.iLike]: `%${criteria.search}%` } },
        { last_name: { [Op.iLike]: `%${criteria.search}%` } },
      ];
    }

    // Filter by status
    if (criteria.status) {
      where.status = criteria.status;
    }

    // Filter by email verification
    if (criteria.emailVerified !== undefined) {
      where.email_verified = criteria.emailVerified;
    }

    // Filter by creation date
    if (criteria.createdAfter || criteria.createdBefore) {
      where.created_at = {};
      if (criteria.createdAfter) {
        where.created_at[Op.gte] = criteria.createdAfter;
      }
      if (criteria.createdBefore) {
        where.created_at[Op.lte] = criteria.createdBefore;
      }
    }

    const { rows, count } = await UserModel.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['created_at', 'DESC']],
    });

    return {
      users: rows.map((model) => this.toDomain(model)),
      total: count,
    };
  }

  async count(criteria?: UserSearchCriteria): Promise<number> {
    const where: any = {
      deleted_at: null,
    };

    if (criteria) {
      if (criteria.status) {
        where.status = criteria.status;
      }
      if (criteria.emailVerified !== undefined) {
        where.email_verified = criteria.emailVerified;
      }
    }

    return UserModel.count({ where });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await UserModel.count({
      where: { id, deleted_at: null },
    });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.count({
      where: { email: email.toLowerCase(), deleted_at: null },
    });
    return count > 0;
  }

  private toDomain(model: UserModel): User {
    return User.fromPersistence({
      id: model.id,
      email: Email.create(model.email),
      passwordHash: model.password_hash,
      firstName: model.first_name,
      lastName: model.last_name,
      status: model.status as UserStatusEnum,
      emailVerified: model.email_verified,
      lastLoginAt: model.last_login_at,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
      deletedAt: model.deleted_at,
    });
  }
}
