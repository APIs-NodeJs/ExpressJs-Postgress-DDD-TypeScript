import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/domain/AppError";
import { Logger } from "../../../shared/infrastructure/logger/logger";
import { isProduction } from "../../../config/env";
import { ZodError } from "zod";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((error) => {
      const path = error.path.join(".");
      if (!details[path]) details[path] = [];
      details[path].push(error.message);
    });

    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details,
        requestId: req.id,
      },
    });
    return;
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    // Log operational errors at warn level
    Logger.warn("Operational error", {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      requestId: req.id,
      path: req.path,
      userId: req.user?.userId,
    });

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.id,
      },
    });
    return;
  }

  // Handle unknown errors
  Logger.error("Unhandled error", err, {
    requestId: req.id,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    body: req.body,
  });

  // Don't leak error details in production
  const message = isProduction
    ? "An unexpected error occurred"
    : err.message || "Internal server error";

  const response: any = {
    error: {
      code: "INTERNAL_ERROR",
      message,
      requestId: req.id,
    },
  };

  // Include stack trace in development
  if (!isProduction && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(500).json(response);
}
