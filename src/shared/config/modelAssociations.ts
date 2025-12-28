// src/shared/config/modelAssociations.ts
import { UserModel } from '../../modules/users/infrastructure/persistence/models/UserModel';
import { WorkspaceModel } from '../../modules/workspaces/infrastructure/persistence/models/WorkspaceModel';
import { WorkspaceMemberModel } from '../../modules/workspaces/infrastructure/persistence/models/WorkspaceMemberModel';
import { RefreshTokenModel } from '../../modules/auth/infrastructure/persistence/models/RefreshTokenModel';

export function setupModelAssociations(): void {
  // User <-> Workspace (Owner relationship)
  UserModel.hasMany(WorkspaceModel, {
    foreignKey: 'ownerId',
    as: 'ownedWorkspaces',
  });
  WorkspaceModel.belongsTo(UserModel, {
    foreignKey: 'ownerId',
    as: 'owner',
  });

  // User <-> WorkspaceMember
  UserModel.hasMany(WorkspaceMemberModel, {
    foreignKey: 'userId',
    as: 'workspaceMemberships',
  });
  WorkspaceMemberModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'user',
  });

  // Workspace <-> WorkspaceMember
  WorkspaceModel.hasMany(WorkspaceMemberModel, {
    foreignKey: 'workspaceId',
    as: 'members',
  });
  WorkspaceMemberModel.belongsTo(WorkspaceModel, {
    foreignKey: 'workspaceId',
    as: 'workspace',
  });

  // User <-> RefreshToken
  UserModel.hasMany(RefreshTokenModel, {
    foreignKey: 'userId',
    as: 'refreshTokens',
  });
  RefreshTokenModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'user',
  });
}
