export const APP_CONSTANTS = {
  API_PREFIX: '/api/v1',
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    USER: 'user',
  } as const,
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  } as const,
} as const;

export type Role = typeof APP_CONSTANTS.ROLES[keyof typeof APP_CONSTANTS.ROLES];
