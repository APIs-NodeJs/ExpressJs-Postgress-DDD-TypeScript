import { UserModel } from '../../../../infrastructure/database/models/UserModel';
import { User } from '../../domain/entities/User';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const userModel = await UserModel.findByPk(id);
    if (!userModel) return null;
    return User.create(userModel.toJSON());
  }

  async findByEmail(email: string): Promise<User | null> {
    const userModel = await UserModel.findOne({ where: { email } });
    if (!userModel) return null;
    return User.create(userModel.toJSON());
  }

  async findByWorkspaceId(workspaceId: string): Promise<User[]> {
    const userModels = await UserModel.findAll({ where: { workspaceId } });
    return userModels.map(model => User.create(model.toJSON()));
  }

  async create(user: User): Promise<User> {
    const userModel = await UserModel.create({
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      workspaceId: user.workspaceId,
      avatar: user.avatar,
    });
    return User.create(userModel.toJSON());
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const userModel = await UserModel.findByPk(id);
    if (!userModel) return null;
    
    await userModel.update(data);
    return User.create(userModel.toJSON());
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.destroy({ where: { id } });
    return result > 0;
  }

  async exists(email: string): Promise<boolean> {
    const count = await UserModel.count({ where: { email } });
    return count > 0;
  }
}
