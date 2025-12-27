// src/modules/auth/infrastructure/persistence/models/WorkspaceModel.ts
import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../../../../../config/database";

interface WorkspaceAttributes {
  id: string;
  name: string;
  ownerId: string;
  status: string;
  memberCount: number;
  members: string; // JSON string containing member data
  settings: string; // JSON string containing workspace settings
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceCreationAttributes extends Optional<
  WorkspaceAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

export class WorkspaceModel
  extends Model<WorkspaceAttributes, WorkspaceCreationAttributes>
  implements WorkspaceAttributes
{
  public id!: string;
  public name!: string;
  public ownerId!: string;
  public status!: string;
  public memberCount!: number;
  public members!: string;
  public settings!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkspaceModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "owner_id",
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "SUSPENDED", "DELETED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
    memberCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "member_count",
    },
    members: {
      type: DataTypes.JSONB, // PostgreSQL JSONB for better performance
      allowNull: false,
      defaultValue: "[]",
      comment: "Array of workspace members with their roles",
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: JSON.stringify({
        maxMembers: 50,
        allowInvites: true,
        isPublic: false,
      }),
      comment: "Workspace configuration settings",
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
    tableName: "workspaces",
    timestamps: true,
    indexes: [
      { fields: ["owner_id"] },
      { fields: ["status"] },
      {
        fields: ["members"],
        using: "GIN", // GIN index for JSONB queries
        name: "idx_workspaces_members",
      },
    ],
  }
);
