import { Transaction } from "sequelize";
import { UserModel } from "../../../../infrastructure/database/models/UserModel";
import { User } from "../../domain/entities/User";

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const model = await UserModel.findOne({
      where: { email: email.toLowerCase() },
    });
    return model ? this.toDomain(model) : null;
  }

  async findById(id: string): Promise<User | null> {
    const model = await UserModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async create(user: User, transaction?: Transaction): Promise<User> {
    const model = await UserModel.create(
      {
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role,
        workspaceId: user.workspaceId,
      },
      { transaction }
    );
    return this.toDomain(model);
  }

  async update(
    id: string,
    updates: Partial<User>,
    transaction?: Transaction
  ): Promise<User | null> {
    const [affectedCount] = await UserModel.update(updates, {
      where: { id },
      transaction,
    });

    if (affectedCount === 0) {
      return null;
    }

    return this.findById(id);
  }

  async delete(id: string, transaction?: Transaction): Promise<boolean> {
    const deletedCount = await UserModel.destroy({
      where: { id },
      transaction,
    });
    return deletedCount > 0;
  }

  async findByWorkspaceId(workspaceId: string): Promise<User[]> {
    const models = await UserModel.findAll({
      where: { workspaceId },
    });
    return models.map((model) => this.toDomain(model));
  }

  private toDomain(model: UserModel): User {
    return User.create({
      id: model.id,
      email: model.email,
      password: model.password,
      name: model.name,
      role: model.role,
      workspaceId: model.workspaceId,
    });
  }
}
