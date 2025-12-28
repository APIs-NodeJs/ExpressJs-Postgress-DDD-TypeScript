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
      field: 'workspace_id', // Map to snake_case
      references: {
        model: 'workspaces',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id', // Map to snake_case
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'role',
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      field: 'permissions',
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'joined_at', // Map to snake_case
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at', // Map to snake_case
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at', // Map to snake_case
    },
  },
  {
    sequelize,
    tableName: 'workspace_members',
    timestamps: true,
    underscored: false, // We're handling field mapping manually
    indexes: [
      { fields: ['workspace_id', 'user_id'], unique: true }, // Use snake_case
      { fields: ['user_id'] }, // Use snake_case
    ],
  }
);
