// src/modules/users/infrastructure/persistence/repositories/UserRepository.ts
import { BaseRepository } from '../../../../../core/infrastructure/persistence/BaseRepository';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/valueObjects/Email';
import { UserRole } from '../../../domain/valueObjects/UserRole';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserModel } from '../models/UserModel';
import { UniqueEntityID } from '../../../../../core/domain/Identifier';

export class UserRepository
  extends BaseRepository<User, UserModel, string>
  implements IUserRepository
{
  async findById(id: string): Promise<User | null> {
    const userModel = await UserModel.findByPk(id, {
      transaction: this.getTransaction(),
    });

    if (!userModel) return null;
    return this.toDomain(userModel);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userModel = await UserModel.findOne({
      where: { email: email.value },
      transaction: this.getTransaction(),
    });

    if (!userModel) return null;
    return this.toDomain(userModel);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const userModel = await UserModel.findOne({
      where: { googleId },
      transaction: this.getTransaction(),
    });

    if (!userModel) return null;
    return this.toDomain(userModel);
  }

  async save(user: User): Promise<void> {
    const exists = await this.exists(user.id);
    const persistence = this.toPersistence(user);

    if (exists) {
      await UserModel.update(persistence, {
        where: { id: user.id },
        transaction: this.getTransaction(),
      });
    } else {
      await UserModel.create(persistence as any, {
        transaction: this.getTransaction(),
      });
    }
  }

  async delete(id: string): Promise<void> {
    await UserModel.destroy({
      where: { id },
      transaction: this.getTransaction(),
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await UserModel.count({
      where: { id },
      transaction: this.getTransaction(),
    });
    return count > 0;
  }

  protected toDomain(model: UserModel): User {
    const emailResult = Email.create(model.email);
    if (emailResult.isFailure) {
      throw new Error('Invalid email in database');
    }

    const userResult = User.create(
      {
        email: emailResult.getValue(),
        firstName: model.firstName,
        lastName: model.lastName,
        passwordHash: model.passwordHash,
        googleId: model.googleId,
        role: model.role as UserRole,
        isActive: model.isActive,
        emailVerified: model.emailVerified,
      },
      new UniqueEntityID(model.id)
    );

    if (userResult.isFailure) {
      throw new Error('Failed to create user domain entity');
    }

    return userResult.getValue();
  }

  protected toPersistence(user: User): Partial<UserModel> {
    return {
      id: user.id,
      email: user.email.value,
      firstName: user.firstName,
      lastName: user.lastName,
      passwordHash: user.passwordHash,
      googleId: user.googleId,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      updatedAt: user.updatedAt,
    };
  }
}
