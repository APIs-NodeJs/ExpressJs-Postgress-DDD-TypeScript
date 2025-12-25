import { Logger } from "./logger";
import { Request } from "express";

/**
 * Standardized logging patterns for consistent application logging
 */
export class LoggingPatterns {
  /**
   * Log user actions (login, signup, etc.)
   */
  static userAction(
    action: string,
    userId: string,
    meta?: Record<string, any>
  ): void {
    Logger.info(`User action: ${action}`, {
      userId,
      action,
      category: "user-action",
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }

  /**
   * Log security-related events
   */
  static securityEvent(
    event: string,
    severity: "low" | "medium" | "high" | "critical",
    meta?: Record<string, any>
  ): void {
    const logLevel =
      severity === "critical" || severity === "high" ? "error" : "warn";

    Logger[logLevel](`Security event: ${event}`, {
      event,
      severity,
      category: "security",
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }

  /**
   * Log API requests with performance metrics
   */
  static apiRequest(req: Request, duration: number, statusCode: number): void {
    const level =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    Logger[level]("API Request", {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode,
      duration,
      userId: req.user?.userId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      category: "api-request",
    });
  }

  /**
   * Log authentication events
   */
  static authEvent(
    event: "signup" | "login" | "logout" | "2fa-enabled" | "password-reset",
    userId: string,
    success: boolean,
    meta?: Record<string, any>
  ): void {
    const message = `Auth: ${event} ${success ? "succeeded" : "failed"}`;
    const level = success ? "info" : "warn";

    Logger[level](message, {
      event,
      userId,
      success,
      category: "authentication",
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }

  /**
   * Log failed login attempts (potential security threat)
   */
  static failedLoginAttempt(
    email: string,
    attempts: number,
    ipAddress?: string,
    locked: boolean = false
  ): void {
    this.securityEvent(
      locked ? "Account locked after failed attempts" : "Failed login attempt",
      locked ? "high" : attempts > 3 ? "medium" : "low",
      {
        email,
        attempts,
        ipAddress,
        locked,
      }
    );
  }

  /**
   * Log database operations
   */
  static databaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    meta?: Record<string, any>
  ): void {
    const level = success ? "debug" : "error";

    Logger[level](`Database: ${operation} on ${table}`, {
      operation,
      table,
      duration,
      success,
      category: "database",
      ...meta,
    });
  }

  /**
   * Log external service calls
   */
  static externalService(
    service: string,
    operation: string,
    duration: number,
    success: boolean,
    meta?: Record<string, any>
  ): void {
    const level = success ? "info" : "error";

    Logger[level](`External service: ${service} - ${operation}`, {
      service,
      operation,
      duration,
      success,
      category: "external-service",
      ...meta,
    });
  }

  /**
   * Log rate limit violations
   */
  static rateLimitExceeded(
    endpoint: string,
    identifier: string, // IP or user ID
    limit: number,
    meta?: Record<string, any>
  ): void {
    this.securityEvent("Rate limit exceeded", "medium", {
      endpoint,
      identifier,
      limit,
      ...meta,
    });
  }

  /**
   * Log application errors
   */
  static applicationError(
    error: Error,
    context: string,
    meta?: Record<string, any>
  ): void {
    Logger.error(`Application error in ${context}`, error, {
      context,
      category: "application-error",
      ...meta,
    });
  }

  /**
   * Log business logic errors
   */
  static businessLogicError(
    operation: string,
    reason: string,
    meta?: Record<string, any>
  ): void {
    Logger.warn(`Business logic error: ${operation}`, {
      operation,
      reason,
      category: "business-logic",
      ...meta,
    });
  }

  /**
   * Log data validation errors
   */
  static validationError(
    field: string,
    value: any,
    rule: string,
    meta?: Record<string, any>
  ): void {
    Logger.debug("Validation error", {
      field,
      value:
        typeof value === "string" && value.length > 100
          ? value.substring(0, 100) + "..."
          : value,
      rule,
      category: "validation",
      ...meta,
    });
  }

  /**
   * Log performance metrics
   */
  static performanceMetric(
    metric: string,
    value: number,
    unit: "ms" | "seconds" | "count",
    meta?: Record<string, any>
  ): void {
    Logger.info(`Performance metric: ${metric}`, {
      metric,
      value,
      unit,
      category: "performance",
      ...meta,
    });
  }

  /**
   * Log audit trail events
   */
  static auditLog(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    meta?: Record<string, any>
  ): void {
    Logger.info("Audit log", {
      userId,
      action,
      resourceType,
      resourceId,
      category: "audit",
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
}
