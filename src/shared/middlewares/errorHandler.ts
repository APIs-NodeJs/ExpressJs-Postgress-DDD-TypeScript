import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";
import { ZodError } from "zod";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
  timestamp: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).id;
  const timestamp = new Date().toISOString();

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    logger.error("Operational error", {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      requestId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
      requestId,
      timestamp,
    };

    return res.status(err.statusCode).json(response);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.warn("Validation error", {
      errors: err.errors,
      path: req.path,
      method: req.method,
      requestId,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
      requestId,
      timestamp,
    };

    return res.status(400).json(response);
  }

  // Handle Sequelize errors
  if (err.name === "SequelizeValidationError") {
    logger.warn("Database validation error", {
      error: err.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: "DATABASE_VALIDATION_ERROR",
        message: "Invalid data",
      },
      requestId,
      timestamp,
    };

    return res.status(400).json(response);
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    logger.warn("Unique constraint violation", {
      error: err.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: "DUPLICATE_ENTRY",
        message: "Resource already exists",
      },
      requestId,
      timestamp,
    };

    return res.status(409).json(response);
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    logger.warn("Foreign key constraint violation", {
      error: err.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: "INVALID_REFERENCE",
        message: "Referenced resource does not exist",
      },
      requestId,
      timestamp,
    };

    return res.status(400).json(response);
  }

  if (err.name === "SequelizeDatabaseError") {
    logger.error("Database error", {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      requestId,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "A database error occurred"
            : err.message,
      },
      requestId,
      timestamp,
    };

    return res.status(500).json(response);
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    logger.warn("JWT error", {
      error: err.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid authentication token",
      },
      requestId,
      timestamp,
    };

    return res.status(401).json(response);
  }

  if (err.name === "TokenExpiredError") {
    logger.warn("Token expired", {
      path: req.path,
      method: req.method,
      requestId,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "Authentication token has expired",
      },
      requestId,
      timestamp,
    };

    return res.status(401).json(response);
  }

  // Handle SyntaxError (malformed JSON)
  if (err instanceof SyntaxError && "body" in err) {
    logger.warn("Malformed JSON", {
      error: err.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Malformed JSON in request body",
      },
      requestId,
      timestamp,
    };

    return res.status(400).json(response);
  }

  // Unexpected errors (should be minimized)
  logger.error("Unexpected error", {
    error: err.message,
    stack: err.stack,
    name: err.name,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    requestId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : err.message,
    },
    requestId,
    timestamp,
  };

  return res.status(500).json(response);
};
