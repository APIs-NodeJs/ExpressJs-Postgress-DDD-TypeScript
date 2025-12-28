// src/modules/workspaces/infrastructure/persistence/models/WorkspaceModel.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../../../shared/config/database.config';
import { WorkspaceMemberModel } from './WorkspaceMemberModel';

interface WorkspaceAttributes {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceCreationAttributes extends Optional<
  WorkspaceAttributes,
  'id' | 'createdAt' | 'updatedAt'
> {}

export class WorkspaceModel
  extends Model<WorkspaceAttributes, WorkspaceCreationAttributes>
  implements WorkspaceAttributes
{
  public id!: string;
  public name!: string;
  public slug!: string;
  public ownerId!: string;
  public description?: string;
  public isActive!: boolean;
  public members?: WorkspaceMemberModel[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkspaceModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'name',
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'slug',
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_id', // Map to snake_case
      references: {
        model: 'users',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active', // Map to snake_case
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
    tableName: 'workspaces',
    timestamps: true,
    underscored: false, // We're handling field mapping manually
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['owner_id'] }, // Use snake_case
    ],
  }
);
