import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../config/database";
import { Role } from "../../../config/constants";

interface LoginAttempts {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

export class UserModel extends Model {
  public id!: string;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: Role;
  public workspaceId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public loginAttempts!: number;
  public lastFailedLogin!: Date | null;
  public lockedUntil!: Date | null;
}

UserModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: "user" },
    workspaceId: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: "users", underscored: true }
);
