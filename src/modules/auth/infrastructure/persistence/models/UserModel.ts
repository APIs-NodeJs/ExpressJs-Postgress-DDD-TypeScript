import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../../../../../config/database";

interface UserAttributes {
  id: string;
  email: string;
  password: string;
  workspaceId: string;
  status: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

export class UserModel
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public email!: string;
  public password!: string;
  public workspaceId!: string;
  public status!: string;
  public emailVerified!: boolean;
  public firstName?: string;
  public lastName?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    workspaceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "workspace_id",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "ACTIVE", "SUSPENDED", "DELETED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "email_verified",
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "last_name",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    indexes: [
      { fields: ["email"] },
      { fields: ["workspace_id"] },
      { fields: ["status"] },
    ],
  }
);
