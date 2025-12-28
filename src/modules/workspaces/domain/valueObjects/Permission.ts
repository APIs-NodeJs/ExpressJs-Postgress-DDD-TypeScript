// src/modules/workspaces/domain/valueObjects/Permission.ts
export enum Permission {
  // Workspace permissions
  WORKSPACE_UPDATE = 'WORKSPACE_UPDATE',
  WORKSPACE_DELETE = 'WORKSPACE_DELETE',

  // Member permissions
  MEMBER_INVITE = 'MEMBER_INVITE',
  MEMBER_REMOVE = 'MEMBER_REMOVE',
  MEMBER_UPDATE_ROLE = 'MEMBER_UPDATE_ROLE',

  // Content permissions
  CONTENT_CREATE = 'CONTENT_CREATE',
  CONTENT_READ = 'CONTENT_READ',
  CONTENT_UPDATE = 'CONTENT_UPDATE',
  CONTENT_DELETE = 'CONTENT_DELETE',

  // Settings permissions
  SETTINGS_VIEW = 'SETTINGS_VIEW',
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
}

// Helper function to get default permissions by role
export function getDefaultPermissionsByRole(role: WorkspaceRole): Permission[] {
  switch (role) {
    case WorkspaceRole.OWNER:
      return Object.values(Permission);

    case WorkspaceRole.ADMIN:
      return [
        Permission.WORKSPACE_UPDATE,
        Permission.MEMBER_INVITE,
        Permission.MEMBER_REMOVE,
        Permission.CONTENT_CREATE,
        Permission.CONTENT_READ,
        Permission.CONTENT_UPDATE,
        Permission.CONTENT_DELETE,
        Permission.SETTINGS_VIEW,
        Permission.SETTINGS_UPDATE,
      ];

    case WorkspaceRole.MEMBER:
      return [
        Permission.CONTENT_CREATE,
        Permission.CONTENT_READ,
        Permission.CONTENT_UPDATE,
        Permission.SETTINGS_VIEW,
      ];

    case WorkspaceRole.VIEWER:
      return [Permission.CONTENT_READ];

    default:
      return [];
  }
}
