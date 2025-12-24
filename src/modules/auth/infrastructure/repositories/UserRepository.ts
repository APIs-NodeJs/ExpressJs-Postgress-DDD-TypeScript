import { UserModel } from '../../../../infrastructure/database/models/UserModel';
import { User } from '../../domain/entities/User';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const model = await UserModel.findOne({ where: { email } });
    return model ? User.create(model.toJSON() as any) : null;
  }

  async findById(id: string): Promise<User | null> {
    const model = await UserModel.findByPk(id);
    return model ? User.create(model.toJSON() as any) : null;
  }

  async create(user: User): Promise<User> {
    const model = await UserModel.create({
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role,
      workspaceId: user.workspaceId,
    });
    return User.create(model.toJSON() as any);
  }
}
