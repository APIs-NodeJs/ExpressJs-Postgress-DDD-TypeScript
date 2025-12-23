import { z } from "zod";

// Environment validation schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Server configuration
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535))
    .default("3000"),

  // Database configuration
  DB_HOST: z.string().min(1, "Database host is required"),
  DB_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535))
    .default("5432"),
  DB_NAME: z.string().min(1, "Database name is required"),
  DB_USER: z.string().min(1, "Database user is required"),
  DB_PASSWORD: z.string().min(1, "Database password is required"),
  DB_LOGGING: z
    .string()
    .transform((val) => val === "true")
    .default("false"),


  // CORS configuration
  CORS_ENABLED: z
    .string()
    .transform((val) => val !== "false")
    .default("true"),
  CORS_ORIGIN: z.string().default("http://localhost:8080"),
  CORS_ALLOWED_ORIGINS: z.string().optional(),

  // Redis configuration (optional)
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number())
    .default("6379"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number())
    .default("0"),

  // Email configuration (optional for now)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number())
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

    // JWT secrets
  JWT_ACCESS_SECRET: z
    .string()
    .min(64, "JWT access secret must be at least 64 characters")
    .regex(/^[A-Za-z0-9+/=_\-!@#$%^&*()]+$/, "JWT secret contains invalid characters")
    .refine((val) => {
      // Check entropy
      const uniqueChars = new Set(val).size;
      return uniqueChars >= 32; // At least 32 unique characters
    }, "JWT secret does not have sufficient entropy"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(64, "JWT refresh secret must be at least 64 characters")
    .regex(/^[A-Za-z0-9+/=_\-!@#$%^&*()]+$/, "JWT secret contains invalid characters"),
});
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Throws error if validation fails
 */
export const validateEnv = (): EnvConfig => {
  try {
    const validated = envSchema.parse(process.env);
    console.info("✅ Environment variables validated successfully");
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    }
    console.error(
      "\n💡 Please check your .env file and ensure all required variables are set.\n"
    );
    process.exit(1);
  }
};

/**
 * Get validated environment config
 */
export const getEnvConfig = (): EnvConfig => {
  return validateEnv();
};
