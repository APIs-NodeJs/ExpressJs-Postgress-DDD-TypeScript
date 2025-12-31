// src/modules/auth/infrastructure/AuthAuditLogger.ts
import { Logger } from '../../../core/utils/Logger';

export enum AuthEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',
  REGISTER_FAILURE = 'REGISTER_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REFRESH_FAILURE = 'TOKEN_REFRESH_FAILURE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE = 'PASSWORD_RESET_COMPLETE',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
}

export interface AuthEvent {
  type: AuthEventType;
  userId?: string;
  email?: string;
  ip: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

interface AuditEntry extends AuthEvent {
  id: string;
  timestamp: Date;
}

interface SuspiciousPattern {
  userId?: string;
  email?: string;
  ip: string;
  failureCount: number;
  lastFailure: Date;
}

export class AuthAuditLogger {
  private readonly logger: Logger;
  private readonly failureThreshold: number = 5;
  private readonly timeWindow: number = 15 * 60 * 1000; // 15 minutes
  private readonly suspiciousPatterns: Map<string, SuspiciousPattern>;

  constructor() {
    this.logger = new Logger('AuthAuditLogger');
    this.suspiciousPatterns = new Map();

    // Clean up old patterns every hour
    setInterval(() => this.cleanupOldPatterns(), 3600000);
  }

  /**
   * Log an authentication event
   */
  async logAuthAttempt(event: AuthEvent): Promise<void> {
    const auditEntry: AuditEntry = {
      id: this.generateId(),
      timestamp: event.timestamp || new Date(),
      type: event.type,
      userId: event.userId,
      email: event.email,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success,
      failureReason: event.failureReason,
      metadata: event.metadata,
    };

    // Log to console/file
    this.logger.info('Auth event', auditEntry);

    // Store in database (placeholder - implement with your DB)
    await this.storeAuditEntry(auditEntry);

    // Check for suspicious patterns
    if (!event.success && this.isLoginAttempt(event.type)) {
      await this.trackFailedAttempt(event);
    }

    // Alert on specific events
    if (this.shouldAlert(event)) {
      await this.alertSecurityTeam(auditEntry);
    }
  }

  /**
   * Store audit entry in database
   */
  private async storeAuditEntry(entry: AuditEntry): Promise<void> {
    try {
      // Placeholder implementation
      // In production, you would insert into a dedicated audit_logs table:
      // await AuditLogModel.create({
      //   id: entry.id,
      //   event_type: entry.type,
      //   user_id: entry.userId,
      //   email: entry.email,
      //   ip_address: entry.ip,
      //   user_agent: entry.userAgent,
      //   success: entry.success,
      //   failure_reason: entry.failureReason,
      //   metadata: JSON.stringify(entry.metadata),
      //   timestamp: entry.timestamp
      // });

      this.logger.debug('Audit entry stored', { id: entry.id });
    } catch (error) {
      this.logger.error('Failed to store audit entry', {
        error: error instanceof Error ? error.message : String(error),
        entryId: entry.id,
      });
    }
  }

  /**
   * Track failed login attempts for suspicious pattern detection
   */
  private async trackFailedAttempt(event: AuthEvent): Promise<void> {
    const key = event.email || event.ip;
    const now = new Date();

    let pattern = this.suspiciousPatterns.get(key);

    if (!pattern) {
      pattern = {
        userId: event.userId,
        email: event.email,
        ip: event.ip,
        failureCount: 0,
        lastFailure: now,
      };
      this.suspiciousPatterns.set(key, pattern);
    }

    // Reset count if outside time window
    if (now.getTime() - pattern.lastFailure.getTime() > this.timeWindow) {
      pattern.failureCount = 0;
    }

    pattern.failureCount++;
    pattern.lastFailure = now;

    // Check if threshold exceeded
    if (pattern.failureCount >= this.failureThreshold) {
      await this.handleSuspiciousActivity(pattern);
    }
  }

  /**
   * Handle detected suspicious activity
   */
  private async handleSuspiciousActivity(pattern: SuspiciousPattern): Promise<void> {
    this.logger.warn('Suspicious activity detected', {
      email: pattern.email,
      ip: pattern.ip,
      failureCount: pattern.failureCount,
    });

    // Log suspicious activity event
    await this.logAuthAttempt({
      type: AuthEventType.SUSPICIOUS_ACTIVITY,
      userId: pattern.userId,
      email: pattern.email,
      ip: pattern.ip,
      userAgent: 'N/A',
      success: false,
      metadata: {
        failureCount: pattern.failureCount,
        timeWindow: this.timeWindow,
      },
    });

    // Alert security team
    await this.alertSecurityTeam({
      id: this.generateId(),
      type: AuthEventType.SUSPICIOUS_ACTIVITY,
      email: pattern.email,
      ip: pattern.ip,
      userAgent: 'N/A',
      success: false,
      timestamp: new Date(),
      metadata: {
        failureCount: pattern.failureCount,
      },
    });

    // Optionally lock account
    // await this.lockAccount(pattern.email);
  }

  /**
   * Alert security team of critical events
   */
  private async alertSecurityTeam(entry: AuditEntry): Promise<void> {
    try {
      // Placeholder implementation
      // In production, you would send alerts via:
      // - Email
      // - Slack/Discord webhook
      // - PagerDuty
      // - Custom monitoring system

      this.logger.warn('Security alert triggered', {
        type: entry.type,
        email: entry.email,
        ip: entry.ip,
      });

      // Example: Send to webhook
      // await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     text: `🚨 Security Alert: ${entry.type}`,
      //     attachments: [{
      //       fields: [
      //         { title: 'Email', value: entry.email || 'N/A' },
      //         { title: 'IP', value: entry.ip },
      //         { title: 'Time', value: entry.timestamp.toISOString() }
      //       ]
      //     }]
      //   })
      // });
    } catch (error) {
      this.logger.error('Failed to alert security team', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if event should trigger an alert
   */
  private shouldAlert(event: AuthEvent): boolean {
    const alertEvents = [
      AuthEventType.SUSPICIOUS_ACTIVITY,
      AuthEventType.ACCOUNT_LOCKED,
      AuthEventType.MFA_DISABLED,
    ];

    return alertEvents.includes(event.type);
  }

  /**
   * Check if event is a login attempt
   */
  private isLoginAttempt(type: AuthEventType): boolean {
    return [AuthEventType.LOGIN_FAILURE, AuthEventType.TOKEN_REFRESH_FAILURE].includes(
      type
    );
  }

  /**
   * Clean up old suspicious patterns
   */
  private cleanupOldPatterns(): void {
    const now = Date.now();
    const cutoff = now - this.timeWindow;

    for (const [key, pattern] of this.suspiciousPatterns.entries()) {
      if (pattern.lastFailure.getTime() < cutoff) {
        this.suspiciousPatterns.delete(key);
      }
    }

    this.logger.debug('Cleaned up old suspicious patterns', {
      remaining: this.suspiciousPatterns.size,
    });
  }

  /**
   * Generate unique ID for audit entry
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, limit: number = 50): Promise<AuditEntry[]> {
    try {
      // Placeholder implementation
      // In production, query from database:
      // const logs = await AuditLogModel.findAll({
      //   where: { userId },
      //   limit,
      //   order: [['timestamp', 'DESC']]
      // });
      // return logs.map(log => this.mapToAuditEntry(log));

      this.logger.debug('Retrieving audit logs', { userId, limit });
      return [];
    } catch (error) {
      this.logger.error('Failed to retrieve audit logs', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return [];
    }
  }

  /**
   * Get recent suspicious activities
   */
  async getRecentSuspiciousActivities(hours: number = 24): Promise<AuditEntry[]> {
    try {
      // Placeholder implementation
      const cutoff = new Date(Date.now() - hours * 3600000);

      // In production, query from database:
      // const logs = await AuditLogModel.findAll({
      //   where: {
      //     event_type: AuthEventType.SUSPICIOUS_ACTIVITY,
      //     timestamp: { [Op.gte]: cutoff }
      //   },
      //   order: [['timestamp', 'DESC']]
      // });

      this.logger.debug('Retrieving suspicious activities', { hours });
      return [];
    } catch (error) {
      this.logger.error('Failed to retrieve suspicious activities', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

// Export singleton instance
export const authAuditLogger = new AuthAuditLogger();
