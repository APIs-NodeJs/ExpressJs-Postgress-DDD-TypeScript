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

    const userOrError = User.create(
      emailOrError.getValue(),
      passwordOrError.getValue(),
      model.workspaceId,
      model.id
    );

    if (userOrError.isFailure) {
      throw new Error(`Failed to create user: ${userOrError.error}`);
    }

    const user = userOrError.getValue();

    // Restore state (using reflection-like access)
    Object.assign(user, {
      _createdAt: model.createdAt,
      _updatedAt: model.updatedAt,
      props: {
        email: emailOrError.getValue(),
        password: passwordOrError.getValue(),
        workspaceId: model.workspaceId,
        status: model.status as UserStatus,
        emailVerified: model.emailVerified,
        firstName: model.firstName,
        lastName: model.lastName,
      },
    });

    return user;
  }

  static toPersistence(user: User): Partial<UserModel> {
    return {
      id: user.id,
      email: user.email.value,
      password: user.password.value,
      workspaceId: user.workspaceId,
      status: user.status,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
