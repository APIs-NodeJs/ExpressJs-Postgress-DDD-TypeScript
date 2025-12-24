import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../config/database';

export class WorkspaceModel extends Model {
  public id!: string;
  public name!: string;
  public ownerId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkspaceModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    ownerId: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: 'workspaces', underscored: true }
);
