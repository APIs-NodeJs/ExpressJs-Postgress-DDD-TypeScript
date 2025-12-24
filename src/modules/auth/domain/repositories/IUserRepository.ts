import { User } from "../entities/User";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByWorkspaceId(workspaceId: string): Promise<User[]>;
  create(user: User, transaction?: any): Promise<User>;
  update(
    id: string,
    updates: Partial<User>,
    transaction?: any
  ): Promise<User | null>;
  delete(id: string, transaction?: any): Promise<boolean>;
}
