import { User } from "../entities/User";
import { Email } from "../value-objects/Email";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}
