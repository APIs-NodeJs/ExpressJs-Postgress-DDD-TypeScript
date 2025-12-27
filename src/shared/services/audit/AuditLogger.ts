import { logger } from "../../utils/logger";

export enum AuditAction {
  // Authentication
  USER_SIGNUP = "USER_SIGNUP",
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED",
  EMAIL_VERIFIED = "EMAIL_VERIFIED",

  // User Management
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_SUSPENDED = "USER_SUSPENDED",
  USER_ACTIVATED = "USER_ACTIVATED",

  // Profile
  PROFILE_VIEWED = "PROFILE_VIEWED",
  PROFILE_UPDATED = "PROFILE_UPDATED",

  // Workspace
  WORKSPACE_CREATED = "WORKSPACE_CREATED",
  WORKSPACE_UPDATED = "WORKSPACE_UPDATED",
  WORKSPACE_DELETED = "WORKSPACE_DELETED",

  // Security
  FAILED_LOGIN_ATTEMPT = "FAILED_LOGIN_ATTEMPT",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",

  // API
  API_KEY_CREATED = "API_KEY_CREATED",
  API_KEY_REVOKED = "API_KEY_REVOKED",
}

export enum AuditLevel {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export interface AuditEntry {
  action: AuditAction;
  level: AuditLevel;
  userId?: string;
  workspaceId?: string;
  targetId?: string; // ID of affected resource
  targetType?: string; // Type of affected resource
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export class AuditLogger {
  /**
   * Log audit event
   */
  static log(entry: Omit<AuditEntry, "timestamp">): void {
    const auditEntry: AuditEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Log based on level
    switch (entry.level) {
      case AuditLevel.CRITICAL:
      case AuditLevel.ERROR:
        logger.error("Audit Log", auditEntry);
        break;
      case AuditLevel.WARNING:
        logger.warn("Audit Log", auditEntry);
        break;
      default:
        logger.info("Audit Log", auditEntry);
    }

    // In production, you might want to:
    // 1. Store in dedicated audit database
    // 2. Send to security monitoring service
    // 3. Trigger alerts for critical actions
    this.persistAuditLog(auditEntry);
  }

  /**
   * Log successful action
   */
  static logSuccess(
    action: AuditAction,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.log({
      action,
      level: AuditLevel.INFO,
      userId,
      success: true,
      metadata,
    });
  }

  /**
   * Log failed action
   */
  static logFailure(
    action: AuditAction,
    userId?: string,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): void {
    this.log({
      action,
      level: AuditLevel.WARNING,
      userId,
      success: false,
      errorMessage,
      metadata,
    });
  }

  /**
   * Log security event
   */
  static logSecurity(
    action: AuditAction,
    level: AuditLevel,
    userId?: string,
    ipAddress?: string,
    metadata?: Record<string, any>
  ): void {
    this.log({
      action,
      level,
      userId,
      ipAddress,
      success: false,
      metadata,
    });
  }

  /**
   * Log user authentication
   */
  static logAuthentication(
    action:
      | AuditAction.USER_LOGIN
      | AuditAction.USER_LOGOUT
      | AuditAction.FAILED_LOGIN_ATTEMPT,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    requestId?: string
  ): void {
    this.log({
      action,
      level: success ? AuditLevel.INFO : AuditLevel.WARNING,
      userId,
      ipAddress,
      userAgent,
      requestId,
      success,
    });
  }

  /**
   * Log data access
   */
  static logDataAccess(
    action: AuditAction,
    userId: string,
    targetId: string,
    targetType: string,
    metadata?: Record<string, any>
  ): void {
    this.log({
      action,
      level: AuditLevel.INFO,
      userId,
      targetId,
      targetType,
      success: true,
      metadata,
    });
  }

  /**
   * Log data modification
   */
  static logDataModification(
    action: AuditAction,
    userId: string,
    targetId: string,
    targetType: string,
    changes?: Record<string, any>
  ): void {
    this.log({
      action,
      level: AuditLevel.INFO,
      userId,
      targetId,
      targetType,
      success: true,
      metadata: { changes },
    });
  }

  /**
   * Persist audit log to storage
   * In production, implement this to store in:
   * - Dedicated audit database
   * - Log aggregation service (ELK, Splunk)
   * - Cloud logging (CloudWatch, Stackdriver)
   */
  private static persistAuditLog(entry: AuditEntry): void {
    // TODO: Implement persistence
    // Example implementations:
    // 1. Database storage
    // await AuditLogModel.create(entry);
    // 2. External service
    // await auditService.send(entry);
    // 3. Message queue
    // await messageQueue.publish('audit.log', entry);
    // For now, just log to file (winston handles this)
  }

  /**
   * Query audit logs (for admin dashboard)
   */
  static async queryLogs(filters: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    level?: AuditLevel;
    limit?: number;
  }): Promise<AuditEntry[]> {
    // TODO: Implement query logic
    // This would query your audit log storage
    return [];
  }

  /**
   * Get user activity history
   */
  static async getUserActivity(
    userId: string,
    limit: number = 50
  ): Promise<AuditEntry[]> {
    return this.queryLogs({ userId, limit });
  }

  /**
   * Detect suspicious activity patterns
   */
  static async detectSuspiciousActivity(userId: string): Promise<boolean> {
    // TODO: Implement pattern detection
    // Examples:
    // - Multiple failed login attempts
    // - Access from unusual locations
    // - Rapid resource access
    // - Permission escalation attempts

    return false;
  }
}

// Middleware to automatically log requests
export const auditMiddleware = (req: any, res: any, next: any) => {
  // Store original end function
  const originalEnd = res.end;

  // Override end function to log after response
  res.end = function (chunk: any, encoding: any) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    // Log based on method and status
    if (req.user && [200, 201, 204].includes(res.statusCode)) {
      const action = `${req.method}_${req.path}`.toUpperCase();

      AuditLogger.log({
        action: action as AuditAction,
        level: AuditLevel.INFO,
        userId: req.user.userId,
        workspaceId: req.user.workspaceId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        requestId: req.id,
        success: true,
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        },
      });
    }
  };

  next();
};
