import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    // Application
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.string().transform(Number).default("3000"),
    API_VERSION: z.string().default("v1"),

    // Database
    DB_HOST: z.string(),
    DB_NAME: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_PORT: z.string().transform(Number).default("5432"),
    DB_SSL: z
      .string()
      .transform((val) => val === "true")
      .default("false"),

    // JWT - Enhanced validation
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"), // Shorter for security
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    // CORS
    ALLOWED_ORIGINS: z.string().transform((val) => val.split(",")),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("60000"),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),
    AUTH_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"), // 15 min
    AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("5"), // Stricter for auth

    // Logging
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

    // Security
    BCRYPT_ROUNDS: z.string().transform(Number).default("12"),
    MAX_LOGIN_ATTEMPTS: z.string().transform(Number).default("5"),
    LOCK_TIME: z.string().transform(Number).default("1800000"), // 30 minutes

    // Optional external services
    SENTRY_DSN: z.string().optional(),
    REDIS_URL: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Ensure secrets are different
    if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different",
      });
    }

    // Production checks
    if (data.NODE_ENV === "production") {
      if (data.DB_PASSWORD === "postgres" || data.DB_PASSWORD.length < 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Weak database password detected in production",
        });
      }
    }
  });

export const env = envSchema.parse(process.env);

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
