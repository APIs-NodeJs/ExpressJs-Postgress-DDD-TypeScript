export const APP_CONSTANTS = {
  API_PREFIX: "/api/v1",
  ROLES: {
    OWNER: "owner",
    ADMIN: "admin",
    USER: "user",
  } as const,
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
  } as const,
} as const;

export type Role =
  (typeof APP_CONSTANTS.ROLES)[keyof typeof APP_CONSTANTS.ROLES];
