import { CorsOptions } from "cors";
import { BadRequestError } from "@core/errors/AppError";

/**
 * Parse allowed origins from environment variable
 */
const getAllowedOrigins = (): string[] => {
  const origins = process.env.CORS_ORIGIN || "http://localhost:3000";
  return origins.split(",").map((origin) => origin.trim());
};

/**
 * CORS configuration
 */
export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new BadRequestError(`Origin ${origin} not allowed by CORS`));
    }
  },

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Allowed HTTP methods
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Allowed headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-HTTP-Method-Override",
    "Accept",
    "Origin",
  ],

  // Exposed headers (accessible to client)
  exposedHeaders: [
    "X-Total-Count",
    "X-Page",
    "X-Per-Page",
    "X-Total-Pages",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],

  // Preflight cache duration (in seconds)
  maxAge: 86400, // 24 hours

  // Pass the CORS preflight response to the next handler
  preflightContinue: false,

  // Provide a status code to use for successful OPTIONS requests
  optionsSuccessStatus: 204,
};

/**
 * Development CORS config (allow all origins)
 */
export const devCorsConfig: CorsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: "*",
  exposedHeaders: "*",
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

/**
 * Get CORS config based on environment
 */
export const getCorsConfig = (): CorsOptions => {
  return process.env.NODE_ENV === "development" ? devCorsConfig : corsConfig;
};
