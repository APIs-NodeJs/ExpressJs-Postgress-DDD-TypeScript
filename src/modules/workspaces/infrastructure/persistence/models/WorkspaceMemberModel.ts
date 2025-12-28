// src/modules/workspaces/infrastructure/persistence/models/WorkspaceMemberModel.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../../../shared/config/database.config';

interface WorkspaceMemberAttributes {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  permissions: string[];
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceMemberCreationAttributes extends Optional<
  WorkspaceMemberAttributes,
  'id' | 'createdAt' | 'updatedAt'
> {}

export class WorkspaceMemberModel
  extends Model<WorkspaceMemberAttributes, WorkspaceMemberCreationAttributes>
  implements WorkspaceMemberAttributes
{
  public id!: string;
  public workspaceId!: string;
  public userId!: string;
  public role!: string;
  public permissions!: string[];
  public joinedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkspaceMemberModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workspaceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'workspaces',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'workspace_members',
    timestamps: true,
    indexes: [
      { fields: ['workspaceId', 'userId'], unique: true },
      { fields: ['userId'] },
    ],
  }
);

// Setup associations
UserModel.hasMany(WorkspaceModel, { foreignKey: 'ownerId', as: 'ownedWorkspaces' });
WorkspaceModel.belongsTo(UserModel, { foreignKey: 'ownerId', as: 'owner' });

UserModel.hasMany(WorkspaceMemberModel, {
  foreignKey: 'userId',
  as: 'workspaceMemberships',
});
WorkspaceModel.hasMany(WorkspaceMemberModel, {
  foreignKey: 'workspaceId',
  as: 'members',
});
WorkspaceMemberModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });
WorkspaceMemberModel.belongsTo(WorkspaceModel, {
  foreignKey: 'workspaceId',
  as: 'workspace',
});

UserModel.hasMany(RefreshTokenModel, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshTokenModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });
