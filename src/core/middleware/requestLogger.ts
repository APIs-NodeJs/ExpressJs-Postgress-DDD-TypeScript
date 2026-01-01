import { Request, Response, NextFunction } from "express";
import { logger } from "@core/config/logger";

/**
 * Request logging middleware
 * Logs all incoming HTTP requests with timing information
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();
  const { method, url, ip } = req;

  // Log request
  logger.http(`→ ${method} ${url}`, {
    ip,
    userAgent: req.get("user-agent"),
    userId: (req as any).user?.id,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    // Log response
    const logLevel =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "http";

    logger[logLevel](`← ${method} ${url} ${statusCode} ${duration}ms`, {
      statusCode,
      duration,
      ip,
      userId: (req as any).user?.id,
    });

    return originalSend.call(this, data);
  };

  next();
};
