import { User } from "../aggregates/User.aggregate";
import { Email } from "../value-objects/Email.vo";
import { Repository } from "../../../../core/infrastructure/persistence/Repository";

export interface IUserRepository extends Repository<User> {
  findByEmail(email: Email): Promise<User | null>;
  findByWorkspaceId(workspaceId: string): Promise<User[]>;
  existsByEmail(email: Email): Promise<boolean>;
}
