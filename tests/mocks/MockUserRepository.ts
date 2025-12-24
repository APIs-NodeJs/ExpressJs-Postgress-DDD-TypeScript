import { User } from "../../src/modules/auth/domain/entities/User";
import { IUserRepository } from "../../src/modules/auth/domain/repositories/IUserRepository";

export class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.workspaceId === workspaceId
    );
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    this.emailIndex.set(user.email.toLowerCase(), user.id);
    return user;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated = User.create({
      ...user,
      ...updates,
    });
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    this.emailIndex.delete(user.email.toLowerCase());
    return this.users.delete(id);
  }

  // Test helpers
  clear(): void {
    this.users.clear();
    this.emailIndex.clear();
  }

  getAll(): User[] {
    return Array.from(this.users.values());
  }
}
