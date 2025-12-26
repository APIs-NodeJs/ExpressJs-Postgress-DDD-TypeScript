import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/aggregates/User.aggregate";
import { Email } from "../../domain/value-objects/Email.vo";
import { UserModel } from "./models/UserModel";
import { UserMapper } from "./mappers/UserMapper";
import { UnitOfWork } from "../../../../core/infrastructure/persistence/UnitOfWork";

export class UserRepository implements IUserRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async findById(id: string): Promise<User | null> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const userModel = await UserModel.findByPk(id, { transaction });

    if (!userModel) {
      return null;
    }

    return UserMapper.toDomain(userModel);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const userModel = await UserModel.findOne({
      where: { email: email.value },
      transaction,
    });

    if (!userModel) {
      return null;
    }

    return UserMapper.toDomain(userModel);
  }

  async findByWorkspaceId(workspaceId: string): Promise<User[]> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const userModels = await UserModel.findAll({
      where: { workspaceId },
      transaction,
    });

    return userModels.map((model) => UserMapper.toDomain(model));
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const count = await UserModel.count({
      where: { email: email.value },
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

  async delete(id: string): Promise<void> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    await UserModel.destroy({
      where: { id },
      transaction,
    });
  }
}
