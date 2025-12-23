
import { logger } from '@infrastructure/logging/logger';

export enum AuditEventType {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_SIGNUP = 'USER_SIGNUP',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  FAILED_LOGIN_ATTEMPT = 'FAILED_LOGIN_ATTEMPT',
  CORS_CONFIG_CHANGED = 'CORS_CONFIG_CHANGED',
}

interface AuditEvent {
  type: AuditEventType;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export class AuditLogger {
  static log(event: Omit<AuditEvent, 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    logger.info('Audit event', auditEvent);

    // In production, send to dedicated audit log service
    // e.g., Splunk, CloudWatch, or dedicated audit database
  }

  static logAuthentication(
    type: AuditEventType,
    email: string,
    success: boolean,
    ip?: string,
    userAgent?: string
  ): void {
    this.log({
      type,
      email,
      ip,
      userAgent,
      metadata: { success },
    });
  }

  static logPasswordChange(userId: string, email: string): void {
    this.log({
      type: AuditEventType.PASSWORD_CHANGED,
      userId,
      email,
    });
  }

  static logRoleChange(
    adminUserId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string
  ): void {
    this.log({
      type: AuditEventType.ROLE_ASSIGNED,
      userId: adminUserId,
      metadata: {
        targetUserId,
        oldRole,
        newRole,
      },
    });
  }
}
