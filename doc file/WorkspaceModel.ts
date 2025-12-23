import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../config/database';

interface WorkspaceAttributes {
  id: string;
  name: string;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WorkspaceCreationAttributes extends Optional<WorkspaceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class WorkspaceModel extends Model<WorkspaceAttributes, WorkspaceCreationAttributes> implements WorkspaceAttributes {
  public id!: string;
  public name!: string;
  public ownerId!: string;
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'workspaces',
    underscored: true,
  }
);
