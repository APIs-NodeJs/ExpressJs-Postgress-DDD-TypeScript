import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { ResponseHandler } from "../responses/ResponseHandler";
import { logger } from "../utils/logger";
import { ZodError } from "zod";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).id;

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

    return ResponseHandler.error(
      res,
      err.statusCode,
      err.code,
      err.message,
      undefined,
      requestId
    );
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.warn("Validation error", {
      errors: err.errors,
      path: req.path,
      method: req.method,
      requestId,
    });

    const validationErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      value: undefined,
    }));

    return ResponseHandler.validationError(res, validationErrors, requestId);
  }

  // Handle Sequelize errors
  if (err.name === "SequelizeValidationError") {
    logger.warn("Database validation error", {
      error: err.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    return ResponseHandler.badRequest(
      res,
      "Invalid data provided",
      process.env.NODE_ENV === "development" ? err.message : undefined,
      requestId
    );
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    logger.warn("Unique constraint violation", {
      error: err.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    return ResponseHandler.conflict(res, "Resource already exists", requestId);
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    logger.warn("Foreign key constraint violation", {
      error: err.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    return ResponseHandler.badRequest(
      res,
      "Referenced resource does not exist",
      undefined,
      requestId
    );
  }

  if (err.name === "SequelizeDatabaseError") {
    logger.error("Database error", {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      requestId,
    });

    return ResponseHandler.internalError(
      res,
      "A database error occurred",
      process.env.NODE_ENV === "development" ? err.message : undefined,
      requestId
    );
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    logger.warn("JWT error", {
      error: err.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    return ResponseHandler.unauthorized(
      res,
      "Invalid authentication token",
      requestId
    );
  }

  if (err.name === "TokenExpiredError") {
    logger.warn("Token expired", {
      path: req.path,
      method: req.method,
      requestId,
    });

    return ResponseHandler.unauthorized(
      res,
      "Authentication token has expired",
      requestId
    );
  }

  // Handle SyntaxError (malformed JSON)
  if (err instanceof SyntaxError && "body" in err) {
    logger.warn("Malformed JSON", {
      error: err.message,
      path: req.path,
      method: req.method,
      requestId,
    });

    return ResponseHandler.badRequest(
      res,
      "Malformed JSON in request body",
      undefined,
      requestId
    );
  }

  // Unexpected errors
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

  return ResponseHandler.internalError(
    res,
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message,
    process.env.NODE_ENV === "development" ? err.stack : undefined,
    requestId
  );
};
