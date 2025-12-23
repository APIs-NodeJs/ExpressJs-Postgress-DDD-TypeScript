import { Response, NextFunction } from "express";
import { AuthRequest } from "./authenticate";
import { ApiResponse } from "@infrastructure/http/responses/ApiResponse";

export type Permission =
  | "products:read"
  | "products:create"
  | "products:update"
  | "products:delete"
  | "features:read"
  | "features:create"
  | "features:update"
  | "features:delete"
  | "tasks:read"
  | "tasks:create"
  | "tasks:update"
  | "tasks:delete"
  | "tasks:assign"
  | "bugs:read"
  | "bugs:create"
  | "bugs:update"
  | "bugs:delete"
  | "sprints:read"
  | "sprints:create"
  | "sprints:update"
  | "sprints:delete"
  | "releases:read"
  | "releases:create"
  | "releases:update"
  | "releases:delete"
  | "team:read"
  | "team:invite"
  | "team:remove"
  | "settings:read"
  | "settings:update"
  | "admin:access"
  | "admin:users"
  | "admin:billing"
  | "admin:reports"
  | "admin:analytics"
  | "admin:cors"
  | "admin:promote_admin";

// Permission map by role
export const rolePermissions: Record<string, Permission[]> = {
  owner: [
    // All admin permissions
    "admin:access",
    "admin:users",
    "admin:billing",
    "admin:reports",
    "admin:analytics",
    "admin:cors",
    "admin:promote_admin",
    // All regular permissions
    "products:read",
    "products:create",
    "products:update",
    "products:delete",
    "features:read",
    "features:create",
    "features:update",
    "features:delete",
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "tasks:delete",
    "tasks:assign",
    "bugs:read",
    "bugs:create",
    "bugs:update",
    "bugs:delete",
    "sprints:read",
    "sprints:create",
    "sprints:update",
    "sprints:delete",
    "releases:read",
    "releases:create",
    "releases:update",
    "releases:delete",
    "team:read",
    "team:invite",
    "team:remove",
    "settings:read",
    "settings:update",
  ],
  admin: [
    // Admin dashboard access (but not CORS or promote admin)
    "admin:access",
    "admin:users",
    "admin:billing",
    "admin:reports",
    "admin:analytics",
    // All regular permissions
    "products:read",
    "products:create",
    "products:update",
    "products:delete",
    "features:read",
    "features:create",
    "features:update",
    "features:delete",
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "tasks:delete",
    "tasks:assign",
    "bugs:read",
    "bugs:create",
    "bugs:update",
    "bugs:delete",
    "sprints:read",
    "sprints:create",
    "sprints:update",
    "sprints:delete",
    "releases:read",
    "releases:create",
    "releases:update",
    "releases:delete",
    "team:read",
    "team:invite",
    "team:remove",
    "settings:read",
    "settings:update",
  ],
  moderator: [
    "products:read",
    "products:create",
    "products:update",
    "features:read",
    "features:create",
    "features:update",
    "features:delete",
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "tasks:assign",
    "bugs:read",
    "bugs:create",
    "bugs:update",
    "bugs:delete",
    "sprints:read",
    "sprints:create",
    "sprints:update",
    "releases:read",
    "releases:create",
    "releases:update",
    "team:read",
    "settings:read",
  ],
  user: [
    "products:read",
    "features:read",
    "features:create",
    "tasks:read",
    "tasks:create",
    "bugs:read",
    "bugs:create",
    "sprints:read",
    "releases:read",
    "team:read",
    "settings:read",
  ],
};

export const checkPermission = (permission: Permission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userRole) {
        return ApiResponse.forbidden(res, "Role information not available");
      }

      const permissions = rolePermissions[req.userRole] || [];

      if (!permissions.includes(permission)) {
        return ApiResponse.forbidden(res, `Permission denied: ${permission}`);
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return ApiResponse.internalError(res);
    }
  };
};

export const getUserPermissions = (role: string): Permission[] => {
  return rolePermissions[role] || rolePermissions.user;
};
