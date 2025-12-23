import cors from "cors";
import { Request, Response, NextFunction } from "express";
import { config } from "@config/env";

// ============================================================================
// ENHANCED CORS MIDDLEWARE WITH RUNTIME MANAGEMENT
// ============================================================================
// This middleware provides:
// - Toggle CORS on/off at runtime
// - Dynamic origin management
// - Configuration inspection
// ============================================================================

// CORS configuration state
let corsEnabled = true;
let corsOrigins: string[] = [config.cors.origin];

/**
 * Dynamic CORS middleware that can be enabled/disabled at runtime
 */
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!corsEnabled) {
    // CORS is disabled, skip CORS handling
    return next();
  }

  // Apply CORS with current configuration
  const corsOptions = {
    origin: (origin: string | undefined, callback: Function) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (corsOrigins.includes(origin) || corsOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: config.cors.credentials,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "X-Requested-With",
    ],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 86400, // 24 hours
  };

  return cors(corsOptions)(req, res, next);
};

/**
 * Get current CORS configuration
 */
export const getCorsConfig = () => ({
  enabled: corsEnabled,
  origins: corsOrigins,
  credentials: config.cors.credentials,
});

/**
 * Enable CORS
 */
export const enableCors = () => {
  corsEnabled = true;
  console.log("CORS enabled");
};

/**
 * Disable CORS
 */
export const disableCors = () => {
  corsEnabled = false;
  console.log("CORS disabled");
};

/**
 * Set allowed CORS origins
 */
export const setCorsOrigins = (origins: string[]) => {
  corsOrigins = origins;
  console.log("CORS origins updated:", origins);
};

/**
 * Add an origin to the allowed list
 */
export const addCorsOrigin = (origin: string) => {
  if (!corsOrigins.includes(origin)) {
    corsOrigins.push(origin);
    console.log("CORS origin added:", origin);
  }
};

/**
 * Remove an origin from the allowed list
 */
export const removeCorsOrigin = (origin: string) => {
  const index = corsOrigins.indexOf(origin);
  if (index > -1) {
    corsOrigins.splice(index, 1);
    console.log("CORS origin removed:", origin);
  }
};

/**
 * Reset CORS to default configuration
 */
export const resetCorsConfig = () => {
  corsEnabled = true;
  corsOrigins = [config.cors.origin];
  console.log("CORS configuration reset to defaults");
};
