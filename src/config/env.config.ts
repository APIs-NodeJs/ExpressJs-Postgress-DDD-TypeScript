import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .default("3000"),

  // Database
  DB_HOST: z.string().min(1, "Database host is required"),
  DB_PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .default("5432"),
  DB_NAME: z.string().min(1, "Database name is required"),
  DB_USER: z.string().min(1, "Database user is required"),
  DB_PASSWORD: z.string().min(1, "Database password is required"),

  // JWT - Enhanced validation
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT access secret must be at least 32 characters for security")
    .refine(
      (val) => val !== "your-super-secret-access-key-min-32-chars-here",
      "Please change the default JWT access secret in production"
    ),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT refresh secret must be at least 32 characters for security")
    .refine(
      (val) => val !== "your-super-secret-refresh-key-min-32-chars-here",
      "Please change the default JWT refresh secret in production"
    ),
  JWT_ACCESS_EXPIRY: z
    .string()
    .regex(/^\d+[smhd]$/, "JWT expiry must be in format: 15m, 1h, 7d, etc.")
    .default("15m"),
  JWT_REFRESH_EXPIRY: z
    .string()
    .regex(/^\d+[smhd]$/, "JWT expiry must be in format: 15m, 1h, 7d, etc.")
    .default("7d"),

  // Redis (optional)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Security
  BCRYPT_ROUNDS: z
    .string()
    .transform(Number)
    .pipe(
      z
        .number()
        .min(10, "Bcrypt rounds should be at least 10")
        .max(15, "Bcrypt rounds above 15 may be too slow")
    )
    .default("10"),
  RATE_LIMIT_WINDOW: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("900000"), // 15 minutes
  RATE_LIMIT_MAX: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("100"),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]).default("info"),

  // CORS
  ALLOWED_ORIGINS: z
    .string()
    .transform((val) => val.split(",").map((origin) => origin.trim()))
    .default("http://localhost:3000"),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));

    // List missing required variables
    const missingVars = parsed.error.errors
      .filter((err) => err.message.includes("required"))
      .map((err) => err.path.join("."));

    if (missingVars.length > 0) {
      console.error(
        "\n⚠️  Missing required variables:",
        missingVars.join(", ")
      );
      console.error("\n💡 Please create a .env file based on .env.example");
    }

    // Check for security issues in production
    if (process.env.NODE_ENV === "production") {
      const securityErrors = parsed.error.errors.filter(
        (err) =>
          err.message.includes("default") || err.message.includes("change")
      );

      if (securityErrors.length > 0) {
        console.error(
          "\n🔒 SECURITY WARNING: Using default secrets in production!"
        );
        console.error("Please set secure JWT secrets in your .env file");
      }
    }

    process.exit(1);
  }

  // Additional runtime validation for production
  if (parsed.data.NODE_ENV === "production") {
    const warnings: string[] = [];

    if (parsed.data.BCRYPT_ROUNDS < 12) {
      warnings.push(
        "⚠️  Consider increasing BCRYPT_ROUNDS to 12+ in production"
      );
    }

    if (!parsed.data.REDIS_HOST) {
      warnings.push(
        "⚠️  Redis is not configured - in-memory rate limiting will be used"
      );
    }

    if (parsed.data.LOG_LEVEL === "debug") {
      warnings.push(
        "⚠️  LOG_LEVEL is set to 'debug' in production - consider using 'info' or 'warn'"
      );
    }

    const origins =
      typeof parsed.data.ALLOWED_ORIGINS === "string"
        ? [parsed.data.ALLOWED_ORIGINS]
        : parsed.data.ALLOWED_ORIGINS;

    if (origins.includes("http://localhost:3000") || origins.includes("*")) {
      warnings.push(
        "⚠️  ALLOWED_ORIGINS includes localhost or wildcard in production"
      );
    }

    if (warnings.length > 0) {
      console.warn("\n⚠️  Production Configuration Warnings:");
      warnings.forEach((warning) => console.warn(warning));
      console.warn("");
    }
  }

  return parsed.data;
}

export const config = validateEnv();

// Type-safe config access
export const getConfig = () => config;

// Helper function to check if Redis is configured
export const isRedisConfigured = (): boolean => {
  return !!(config.REDIS_HOST && config.REDIS_PORT);
};

// Helper function to get database connection string (useful for migrations)
export const getDatabaseUrl = (): string => {
  return `postgres://${config.DB_USER}:${config.DB_PASSWORD}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`;
};
