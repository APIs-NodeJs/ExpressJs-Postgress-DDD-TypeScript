// src/modules/auth/infrastructure/repositories/user.repository.ts

import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { UserModel } from '../models/user.model';
import { Op } from 'sequelize';

export class UserRepository implements IUserRepository {
  async save(user: User): Promise<User> {
    const userProps = user.toObject();

    const model = await UserModel.create({
      id: userProps.id,
      email: userProps.email.getValue(),
      password_hash: userProps.passwordHash,
      first_name: userProps.firstName,
      last_name: userProps.lastName,
      status: userProps.status,
      email_verified: userProps.emailVerified,
      last_login_at: userProps.lastLoginAt,
    });

    return this.toDomain(model);
  }

  async findById(id: string): Promise<User | null> {
    const model = await UserModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const model = await UserModel.findOne({
      where: { email: email.getValue() },
    });
    return model ? this.toDomain(model) : null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await UserModel.count({
      where: { email: email.getValue() },
    });
    return count > 0;
  }

  async update(user: User): Promise<User> {
    const userProps = user.toObject();

    await UserModel.update(
      {
        email: userProps.email.getValue(),
        password_hash: userProps.passwordHash,
        first_name: userProps.firstName,
        last_name: userProps.lastName,
        status: userProps.status,
        email_verified: userProps.emailVerified,
        last_login_at: userProps.lastLoginAt,
      },
      {
        where: { id: userProps.id },
      }
    );

    const updated = await UserModel.findByPk(userProps.id);
    if (!updated) {
      throw new Error('User not found after update');
    }

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await UserModel.destroy({
      where: { id },
    });
  }

  async findAll(limit: number = 10, offset: number = 0): Promise<User[]> {
    const models = await UserModel.findAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return models.map((model) => this.toDomain(model));
  }

  async count(): Promise<number> {
    return UserModel.count();
  }

  private toDomain(model: UserModel): User {
    return User.fromPersistence({
      id: model.id,
      email: Email.create(model.email),
      passwordHash: model.password_hash,
      firstName: model.first_name,
      lastName: model.last_name,
      status: model.status as UserStatus,
      emailVerified: model.email_verified,
      lastLoginAt: model.last_login_at,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
      deletedAt: model.deleted_at,
    });
  }
}
