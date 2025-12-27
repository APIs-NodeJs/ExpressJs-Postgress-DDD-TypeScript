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
      model.workspaceId, // Can be null
      model.status as UserStatus,
      model.emailVerified,
      model.firstName || undefined,
      model.lastName || undefined,
      model.lastLoginAt || undefined,
      model.deletedAt || null, // ✅ FIXED: Use null instead of new Date()
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
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      lastLoginAt: user.lastLoginAt || null,
      lastLoginIp: (user as any)["props"]?.lastLoginIp || null,
      deletedAt: user.deletedAt || null,
      deletedBy: (user as any)["props"]?.deletedBy || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
