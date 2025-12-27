// src/modules/auth/infrastructure/persistence/mappers/UserMapper.ts
import { User, UserStatus } from "../../../domain/aggregates/User.aggregate";
import { UserModel } from "../models/UserModel";
import { Email } from "../../../domain/value-objects/Email.vo";
import { Password } from "../../../domain/value-objects/Password.vo";

export class UserMapper {
  static toDomain(model: UserModel): User {
    const emailOrError = Email.create(model.email);
    if (emailOrError.isFailure) {
      throw new Error(`Invalid email: ${emailOrError.error}`);
    }

    const passwordOrError = Password.createHashed(model.password);
    if (passwordOrError.isFailure) {
      throw new Error(`Invalid password: ${passwordOrError.error}`);
    }

    const userOrError = User.reconstitute(
      model.id,
      emailOrError.getValue(),
      passwordOrError.getValue(),
      model.workspaceId, // Can be null now
      model.status as UserStatus,
      model.emailVerified,
      model.firstName,
      model.lastName,
      model.lastLoginAt || undefined,
      model.deletedAt ?? new Date(), // Provide a default value for deletedAt
      model.deletedBy || undefined,
      model.createdAt,
      model.updatedAt
    );

    if (userOrError.isFailure) {
      throw new Error(`Failed to create user: ${userOrError.error}`);
    }

    return userOrError.getValue();
  }

  static toPersistence(user: User): Partial<UserModel> {
    return {
      id: user.id,
      email: user.email.value,
      password: user.password.value,
      workspaceId: user.workspaceId, // Can be null
      status: user.status,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      lastLoginAt: user.lastLoginAt || null,
      lastLoginIp: user["props"]?.lastLoginIp || null,
      deletedAt: user.deletedAt,
      deletedBy: user["props"]?.deletedBy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
