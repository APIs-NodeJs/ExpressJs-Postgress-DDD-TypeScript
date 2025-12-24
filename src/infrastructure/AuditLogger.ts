import { AuditLogModel } from "./models/AuditLogModel";

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
  static async log(entry: AuditLogEntry): Promise<void> {
    await AuditLogModel.create(entry);
  }

  static async getByUser(userId: string, limit: number = 50) {
    return AuditLogModel.findAll({
      where: { userId },
      limit,
      order: [["created_at", "DESC"]],
    });
  }

  static async getByWorkspace(workspaceId: string, limit: number = 100) {
    return AuditLogModel.findAll({
      where: { workspaceId },
      limit,
      order: [["created_at", "DESC"]],
    });
  }
}
