/**
 * Centralized application configuration
 * All magic numbers and business rules should be defined here
 */
export const APP_CONFIG = {
  // Password Requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
    BCRYPT_ROUNDS: 12,
  },

  // Account Lockout Policy
  LOCKOUT: {
    MAX_ATTEMPTS: 5,
    LOCK_DURATION_MS: 30 * 60 * 1000, // 30 minutes
    ATTEMPT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },

  // Token Expiration
  TOKENS: {
    VERIFICATION_EXPIRY_HOURS: 24,
    RESET_EXPIRY_HOURS: 1,
    REFRESH_EXPIRY_DAYS: 7,
    ACCESS_EXPIRY_MINUTES: 15,
  },

  // Two-Factor Authentication
  TWO_FA: {
    BACKUP_CODES_COUNT: 10,
    BACKUP_CODE_LENGTH: 8,
    TOTP_WINDOW: 2, // Allow 2 time steps before/after for clock drift
    ISSUER: "Devcycle API",
  },

  // Validation Rules
  VALIDATION: {
    EMAIL_MAX_LENGTH: 255,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    WORKSPACE_NAME_MIN_LENGTH: 2,
    WORKSPACE_NAME_MAX_LENGTH: 100,
  },

  // Rate Limiting
  RATE_LIMITING: {
    GLOBAL: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_REQUESTS: 100,
    },
    AUTH: {
      SIGNUP: {
        WINDOW_MS: 60 * 60 * 1000, // 1 hour
        MAX_REQUESTS: 3,
      },
      LOGIN: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 5,
      },
      PASSWORD_RESET: {
        WINDOW_MS: 60 * 60 * 1000, // 1 hour
        MAX_REQUESTS: 3,
      },
    },
  },

  // Session Management
  SESSION: {
    MAX_SESSIONS_PER_USER: 5,
    CLEANUP_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
  },

  // Database
  DATABASE: {
    CONNECTION_POOL: {
      PRODUCTION: {
        MAX: 20,
        MIN: 5,
      },
      DEVELOPMENT: {
        MAX: 5,
        MIN: 2,
      },
    },
    RETRY: {
      MAX_ATTEMPTS: 3,
      TIMEOUT_MS: 3000,
    },
  },

  // Security Headers
  SECURITY: {
    HSTS_MAX_AGE: 31536000, // 1 year
    CSP_DIRECTIVES: {
      DEFAULT_SRC: ["'self'"],
      STYLE_SRC: ["'self'", "'unsafe-inline'"],
      SCRIPT_SRC: ["'self'"],
      IMG_SRC: ["'self'", "data:", "https:"],
    },
  },

  // Artificial Delays (for security)
  TIMING: {
    EMAIL_ENUMERATION_PREVENTION_MS: 200, // Random delay to prevent timing attacks
    ARTIFICIAL_DELAY_MIN_MS: 100,
    ARTIFICIAL_DELAY_MAX_MS: 300,
  },
} as const;

// Type-safe access helpers
export type AppConfig = typeof APP_CONFIG;

/**
 * Get configuration value with type safety
 */
export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return APP_CONFIG[key];
}

/**
 * Calculate expiration date based on config
 */
export class ExpirationHelper {
  static verificationTokenExpiry(): Date {
    const date = new Date();
    date.setHours(
      date.getHours() + APP_CONFIG.TOKENS.VERIFICATION_EXPIRY_HOURS
    );
    return date;
  }

  static resetTokenExpiry(): Date {
    const date = new Date();
    date.setHours(date.getHours() + APP_CONFIG.TOKENS.RESET_EXPIRY_HOURS);
    return date;
  }

  static refreshTokenExpiry(): Date {
    const date = new Date();
    date.setDate(date.getDate() + APP_CONFIG.TOKENS.REFRESH_EXPIRY_DAYS);
    return date;
  }

  static sessionExpiry(): Date {
    return this.refreshTokenExpiry();
  }
}
