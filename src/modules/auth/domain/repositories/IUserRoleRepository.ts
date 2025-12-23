import { UserRole } from "../entities/UserRole";
import { AppRoleType } from "../value-objects/AppRole";

export interface IUserRoleRepository {
  findById(id: string): Promise<UserRole | null>;
  findByUserId(userId: string): Promise<UserRole | null>;
  findByRole(role: AppRoleType): Promise<UserRole[]>;
  hasRole(userId: string, role: AppRoleType): Promise<boolean>;
  save(userRole: UserRole): Promise<UserRole>;
  delete(id: string): Promise<boolean>;
  exists(userId: string): Promise<boolean>;
}
