export enum Permission {
  // Workspace permissions
  WORKSPACE_READ = "workspace:read",
  WORKSPACE_WRITE = "workspace:write",
  WORKSPACE_DELETE = "workspace:delete",
  WORKSPACE_SETTINGS = "workspace:settings",

  // User permissions
  USER_READ = "user:read",
  USER_INVITE = "user:invite",
  USER_REMOVE = "user:remove",
  USER_UPDATE_ROLE = "user:update-role",

  // Project permissions (future)
  PROJECT_CREATE = "project:create",
  PROJECT_READ = "project:read",
  PROJECT_UPDATE = "project:update",
  PROJECT_DELETE = "project:delete",

  // Feature flag permissions (future)
  FEATURE_CREATE = "feature:create",
  FEATURE_READ = "feature:read",
  FEATURE_UPDATE = "feature:update",
  FEATURE_DELETE = "feature:delete",
}

export type Role = "owner" | "admin" | "user";

export const RolePermissions: Record<Role, Permission[]> = {
  owner: [
    // Workspace
    Permission.WORKSPACE_READ,
    Permission.WORKSPACE_WRITE,
    Permission.WORKSPACE_DELETE,
    Permission.WORKSPACE_SETTINGS,

    // Users
    Permission.USER_READ,
    Permission.USER_INVITE,
    Permission.USER_REMOVE,
    Permission.USER_UPDATE_ROLE,

    // Projects
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,

    // Features
    Permission.FEATURE_CREATE,
    Permission.FEATURE_READ,
    Permission.FEATURE_UPDATE,
    Permission.FEATURE_DELETE,
  ],

  admin: [
    // Workspace
    Permission.WORKSPACE_READ,
    Permission.WORKSPACE_WRITE,

    // Users
    Permission.USER_READ,
    Permission.USER_INVITE,

    // Projects
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,

    // Features
    Permission.FEATURE_CREATE,
    Permission.FEATURE_READ,
    Permission.FEATURE_UPDATE,
    Permission.FEATURE_DELETE,
  ],

  user: [
    // Workspace
    Permission.WORKSPACE_READ,

    // Users
    Permission.USER_READ,

    // Projects
    Permission.PROJECT_READ,

    // Features
    Permission.FEATURE_READ,
  ],
};

export class PermissionChecker {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: Role, permission: Permission): boolean {
    return RolePermissions[role]?.includes(permission) ?? false;
  }

  /**
   * Check if a role has any of the specified permissions
   */
  static hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some((permission) =>
      this.hasPermission(role, permission)
    );
  }

  /**
   * Check if a role has all of the specified permissions
   */
  static hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every((permission) =>
      this.hasPermission(role, permission)
    );
  }

  /**
   * Get all permissions for a role
   */
  static getPermissions(role: Role): Permission[] {
    return RolePermissions[role] ?? [];
  }
}
