import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/AdvancedLogger";

/**
 * Sanitize incoming requests to prevent injection attacks
 */
export const sanitizeRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObject(req.query as Record<string, any>);
    }

    // Sanitize params
    if (req.params && typeof req.params === "object") {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error("Request sanitization error", {
      error: error instanceof Error ? error.message : "Unknown error",
      requestId: (req as any).id,
    });
    next();
  }
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const key in obj) {
    // Skip prototype pollution attempts
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      logger.warn("Blocked prototype pollution attempt", { key });
      continue;
    }

    const value = obj[key];

    // Recursively sanitize nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    }
    // Sanitize arrays
    else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? sanitizeObject(item)
          : sanitizeValue(item)
      );
    }
    // Sanitize primitive values
    else {
      sanitized[key] = sanitizeValue(value);
    }
  }

  return sanitized;
}

/**
 * Sanitize individual values
 */
function sanitizeValue(value: any): any {
  // Return null/undefined/numbers/booleans as-is
  if (
    value === null ||
    value === undefined ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  // Sanitize strings
  if (typeof value === "string") {
    // Trim whitespace
    let sanitized = value.trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, "");

    // Limit length to prevent DOS
    const MAX_STRING_LENGTH = 10000;
    if (sanitized.length > MAX_STRING_LENGTH) {
      logger.warn("String value truncated", {
        originalLength: sanitized.length,
        maxLength: MAX_STRING_LENGTH,
      });
      sanitized = sanitized.substring(0, MAX_STRING_LENGTH);
    }

    // Detect and log potential XSS attempts
    if (containsPotentialXSS(sanitized)) {
      logger.warn("Potential XSS detected in input", {
        value: sanitized.substring(0, 100),
      });
    }

    // Detect and log potential SQL injection attempts
    if (containsPotentialSQLInjection(sanitized)) {
      logger.warn("Potential SQL injection detected", {
        value: sanitized.substring(0, 100),
      });
    }

    return sanitized;
  }

  return value;
}

/**
 * Check for potential XSS patterns
 */
function containsPotentialXSS(str: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers
    /<iframe/gi,
    /eval\(/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(str));
}

/**
 * Check for potential SQL injection patterns
 */
function containsPotentialSQLInjection(str: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION.*SELECT)/gi,
    /(\bOR\b.*=.*)/gi,
    /(--|\#|\/\*|\*\/)/g,
  ];

  return sqlPatterns.some((pattern) => pattern.test(str));
}

/**
 * Strict sanitization for user-generated content
 * Use this for fields that will be displayed to other users
 */
export const sanitizeUserContent = (content: string): string => {
  if (typeof content !== "string") return "";

  let sanitized = content.trim();

  // Remove all HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>\"'&]/g, "");

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ");

  // Limit length
  const MAX_CONTENT_LENGTH = 5000;
  if (sanitized.length > MAX_CONTENT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_CONTENT_LENGTH);
  }

  return sanitized;
};
