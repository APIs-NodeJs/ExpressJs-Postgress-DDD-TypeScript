export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",

  // Authorization
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_REVOKED: "TOKEN_REVOKED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_INPUT: "INVALID_INPUT",

  // Resources
  USER_NOT_FOUND: "USER_NOT_FOUND",
  WORKSPACE_NOT_FOUND: "WORKSPACE_NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  AUTH_RATE_LIMIT_EXCEEDED: "AUTH_RATE_LIMIT_EXCEEDED",

  // 2FA
  TWO_FA_REQUIRED: "TWO_FA_REQUIRED",
  INVALID_2FA_TOKEN: "INVALID_2FA_TOKEN",
  TWO_FA_NOT_ENABLED: "TWO_FA_NOT_ENABLED",

  // Password Reset
  INVALID_RESET_TOKEN: "INVALID_RESET_TOKEN",
  RESET_TOKEN_EXPIRED: "RESET_TOKEN_EXPIRED",

  // System
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.INVALID_CREDENTIALS]: "Invalid email or password",
  [ERROR_CODES.ACCOUNT_LOCKED]:
    "Account temporarily locked due to multiple failed login attempts",
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]:
    "An account with this email already exists",
  [ERROR_CODES.WEAK_PASSWORD]: "Password does not meet security requirements",
  [ERROR_CODES.EMAIL_NOT_VERIFIED]:
    "Please verify your email address before logging in",

  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]:
    "You do not have permission to perform this action",
  [ERROR_CODES.INVALID_TOKEN]: "Invalid authentication token",
  [ERROR_CODES.TOKEN_EXPIRED]: "Authentication token has expired",
  [ERROR_CODES.TOKEN_REVOKED]: "Authentication token has been revoked",

  [ERROR_CODES.VALIDATION_ERROR]: "Validation failed",
  [ERROR_CODES.INVALID_EMAIL]: "Invalid email address",
  [ERROR_CODES.INVALID_INPUT]: "Invalid input provided",

  [ERROR_CODES.USER_NOT_FOUND]: "User not found",
  [ERROR_CODES.WORKSPACE_NOT_FOUND]: "Workspace not found",
  [ERROR_CODES.RESOURCE_NOT_FOUND]: "Resource not found",

  [ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    "Too many requests. Please try again later",
  [ERROR_CODES.AUTH_RATE_LIMIT_EXCEEDED]:
    "Too many authentication attempts. Please try again later",

  [ERROR_CODES.TWO_FA_REQUIRED]: "Two-factor authentication is required",
  [ERROR_CODES.INVALID_2FA_TOKEN]: "Invalid two-factor authentication token",
  [ERROR_CODES.TWO_FA_NOT_ENABLED]: "Two-factor authentication is not enabled",

  [ERROR_CODES.INVALID_RESET_TOKEN]: "Invalid or expired password reset token",
  [ERROR_CODES.RESET_TOKEN_EXPIRED]: "Password reset token has expired",

  [ERROR_CODES.INTERNAL_ERROR]: "An unexpected error occurred",
  [ERROR_CODES.DATABASE_ERROR]: "Database operation failed",
  [ERROR_CODES.SERVICE_UNAVAILABLE]: "Service temporarily unavailable",
};

export class ErrorCodeHelper {
  static getMessage(code: ErrorCode, customMessage?: string): string {
    return (
      customMessage ||
      ERROR_MESSAGES[code] ||
      ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR]
    );
  }

  static isAuthError(code: ErrorCode): boolean {
    return [
      ERROR_CODES.INVALID_CREDENTIALS,
      ERROR_CODES.ACCOUNT_LOCKED,
      ERROR_CODES.EMAIL_NOT_VERIFIED,
      ERROR_CODES.INVALID_TOKEN,
      ERROR_CODES.TOKEN_EXPIRED,
    ].includes(code);
  }

  static isClientError(code: ErrorCode): boolean {
    return [
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.INVALID_EMAIL,
      ERROR_CODES.INVALID_INPUT,
      ERROR_CODES.WEAK_PASSWORD,
    ].includes(code);
  }
}
