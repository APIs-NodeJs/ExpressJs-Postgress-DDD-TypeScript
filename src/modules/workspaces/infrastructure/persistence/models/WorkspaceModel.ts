// src/modules/workspaces/infrastructure/persistence/models/WorkspaceModel.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../../../shared/config/database.config';

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
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'workspaces',
    timestamps: true,
    indexes: [{ fields: ['slug'], unique: true }, { fields: ['ownerId'] }],
  }
);
