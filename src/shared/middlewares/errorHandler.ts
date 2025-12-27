import { Request, Response, NextFunction } from "express";
import { AppError, isAppError } from "../errors/AppError";
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
  if (isAppError(err)) {
    logger.error("Operational error", {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      requestId,
      details: err.details,
    });

    return ResponseHandler.error(
      res,
      err.statusCode,
      err.code,
      err.message,
      err.details,
      requestId
    );
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.warn("Validation error", {
      errors: err.errors,
      path: req.path,
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
  if (err.name.startsWith("Sequelize")) {
    logger.error("Database error", {
      error: err.message,
      name: err.name,
      path: req.path,
      requestId,
    });

    const message =
      err.name === "SequelizeUniqueConstraintError"
        ? "Resource already exists"
        : err.name === "SequelizeForeignKeyConstraintError"
          ? "Referenced resource does not exist"
          : "A database error occurred";

    const statusCode =
      err.name === "SequelizeUniqueConstraintError" ? 409 : 400;

    return ResponseHandler.error(
      res,
      statusCode,
      err.name.replace("Sequelize", "").toUpperCase(),
      message,
      process.env.NODE_ENV === "development" ? err.message : undefined,
      requestId
    );
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    logger.warn("JWT error", {
      error: err.message,
      path: req.path,
      requestId,
    });

    return ResponseHandler.unauthorized(
      res,
      err.name === "TokenExpiredError"
        ? "Authentication token has expired"
        : "Invalid authentication token",
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
    requestId,
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
