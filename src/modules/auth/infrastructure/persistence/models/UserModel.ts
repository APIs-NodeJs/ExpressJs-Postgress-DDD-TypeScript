// src/modules/auth/infrastructure/persistence/models/UserModel.ts
import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../../../../../config/database";

interface UserAttributes {
  id: string;
  email: string;
  password: string;
  workspaceId: string | null; // NOW NULLABLE
  status: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes extends Optional<
  UserAttributes,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "deletedBy"
  | "lastLoginAt"
  | "lastLoginIp"
> {}

export class UserModel
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public email!: string;
  public password!: string;
  public workspaceId!: string | null;
  public status!: string;
  public emailVerified!: boolean;
  public firstName?: string;
  public lastName?: string;
  public lastLoginAt?: Date | null;
  public lastLoginIp?: string | null;
  public deletedAt?: Date | null;
  public deletedBy?: string | null;
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
      allowNull: true, // NOW NULLABLE - users can exist without workspace
      field: "workspace_id",
      comment: "User can be created without workspace initially",
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
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_login_at",
      comment: "Timestamp of last successful login",
    },
    lastLoginIp: {
      type: DataTypes.STRING(45), // IPv6 max length
      allowNull: true,
      field: "last_login_ip",
      comment: "IP address of last login",
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      field: "deleted_at",
    },
    deletedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      field: "deleted_by",
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
      {
        fields: ["email"],
        unique: true,
        name: "idx_users_email_unique",
      },
      {
        fields: ["workspace_id"],
        name: "idx_users_workspace_id",
      },
      {
        fields: ["status"],
        name: "idx_users_status",
      },
      {
        fields: ["deleted_at"],
        name: "idx_users_deleted_at",
      },
      {
        fields: ["email", "deleted_at"],
        name: "idx_users_email_deleted",
      },
      {
        fields: ["last_login_at"],
        name: "idx_users_last_login",
      },
    ],
  }
);
