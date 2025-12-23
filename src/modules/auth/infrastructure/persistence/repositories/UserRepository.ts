import { BaseRepository } from "@shared/infrastructure/BaseRepository";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { User } from "@modules/auth/domain/entities/User";
import { Email } from "@modules/auth/domain/value-objects/Email";
import { Password } from "@modules/auth/domain/value-objects/Password";
import { UserModel } from "../models/UserModel";

export class UserRepository
  extends BaseRepository<User, UserModel>
  implements IUserRepository
{
  constructor() {
    super(UserModel);
  }

  protected toDomain(model: UserModel): User {
    const emailOrError = Email.create(model.email);
    const passwordOrError = Password.createHashed(model.password);

    if (emailOrError.isFailure || passwordOrError.isFailure) {
      throw new Error("Invalid user data from database");
    }

    return User.create(
      {
        email: emailOrError.getValue(),
        password: passwordOrError.getValue(),
        name: model.name,
        avatar: model.avatar,
        emailVerified: model.emailVerified,
        workspaceId: model.workspaceId,
      },
      model.id
    );
  }

  protected toModel(domain: User): Partial<UserModel> {
    return {
      id: domain.id,
      email: domain.email.value,
      password: domain.password.value,
      name: domain.name,
      avatar: domain.avatar,
      emailVerified: domain.emailVerified,
      workspaceId: domain.workspaceId,
    };
  }

  async findByEmail(email: Email): Promise<User | null> {
    const model = await this.model.findOne({
      where: { email: email.value },
    });
    return model ? this.toDomain(model) : null;
  }
}
