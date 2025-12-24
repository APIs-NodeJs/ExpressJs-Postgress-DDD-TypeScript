import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { Logger } from "../shared/infrastructure/logger/logger";

// Define the AuditLogModel
export class AuditLogModel extends Model {
  public id!: string;
  public userId!: string | null;
  public workspaceId!: string;
  public action!: string;
  public resourceType!: string;
  public resourceId!: string | null;
  public ipAddress!: string | null;
  public userAgent!: string | null;
  public metadata!: Record<string, any> | null;
  public readonly createdAt!: Date;
}

AuditLogModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    workspaceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "audit_logs",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // Audit logs are immutable
  }
);

export interface AuditLogEntry {
  userId?: string;
  workspaceId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditLogger {
  /**
   * Create an audit log entry
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await AuditLogModel.create({
        userId: entry.userId || null,
        workspaceId: entry.workspaceId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId || null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        metadata: entry.metadata || null,
      });
    } catch (error) {
      // Don't throw - audit logging should never break the main flow
      Logger.error("Failed to create audit log", error, { entry });
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getByUser(
    userId: string,
    limit: number = 50
  ): Promise<AuditLogModel[]> {
    try {
      return await AuditLogModel.findAll({
        where: { userId },
        limit,
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      Logger.error("Failed to fetch user audit logs", error, { userId });
      return [];
    }
  }

  /**
   * Get audit logs for a specific workspace
   */
  static async getByWorkspace(
    workspaceId: string,
    limit: number = 100
  ): Promise<AuditLogModel[]> {
    try {
      return await AuditLogModel.findAll({
        where: { workspaceId },
        limit,
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      Logger.error("Failed to fetch workspace audit logs", error, {
        workspaceId,
      });
      return [];
    }
  }

  /**
   * Get audit logs by action type
   */
  static async getByAction(
    workspaceId: string,
    action: string,
    limit: number = 50
  ): Promise<AuditLogModel[]> {
    try {
      return await AuditLogModel.findAll({
        where: { workspaceId, action },
        limit,
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      Logger.error("Failed to fetch audit logs by action", error, {
        workspaceId,
        action,
      });
      return [];
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getByResource(
    resourceType: string,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLogModel[]> {
    try {
      return await AuditLogModel.findAll({
        where: { resourceType, resourceId },
        limit,
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      Logger.error("Failed to fetch resource audit logs", error, {
        resourceType,
        resourceId,
      });
      return [];
    }
  }
}