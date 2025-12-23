import { AppRoleType } from "@modules/auth/domain/value-objects/AppRole";
import { Permission } from "@modules/auth/presentation/middlewares/permissions";

export interface UserRoleDto {
  id: string;
  userId: string;
  role: AppRoleType;
  createdAt: string;
  updatedAt: string;
}

export interface AssignRoleRequest {
  userId: string;
  role: AppRoleType;
}

export interface UserWithRoleDto {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: AppRoleType;
  permissions: Permission[];
  emailVerified: boolean;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}
