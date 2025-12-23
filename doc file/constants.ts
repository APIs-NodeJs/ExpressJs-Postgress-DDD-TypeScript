export const APP_CONSTANTS = {
  API_VERSION: 'v1',
  API_PREFIX: '/api/v1',
  
  // Roles
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    USER: 'user',
  } as const,
  
  // Permissions
  PERMISSIONS: {
    PRODUCTS_READ: 'products:read',
    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_UPDATE: 'products:update',
    PRODUCTS_DELETE: 'products:delete',
    FEATURES_READ: 'features:read',
    FEATURES_CREATE: 'features:create',
    FEATURES_UPDATE: 'features:update',
    FEATURES_DELETE: 'features:delete',
    USERS_MANAGE: 'users:manage',
    CORS_MANAGE: 'cors:manage',
  } as const,
  
  // Security
  SECURITY: {
    BCRYPT_ROUNDS: 12,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
    PASSWORD_MIN_LENGTH: 8,
  },
  
  // Error Codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  } as const,
  
  // HTTP Status
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  } as const,
} as const;

export type Role = typeof APP_CONSTANTS.ROLES[keyof typeof APP_CONSTANTS.ROLES];
export type Permission = typeof APP_CONSTANTS.PERMISSIONS[keyof typeof APP_CONSTANTS.PERMISSIONS];
export type ErrorCode = typeof APP_CONSTANTS.ERROR_CODES[keyof typeof APP_CONSTANTS.ERROR_CODES];
