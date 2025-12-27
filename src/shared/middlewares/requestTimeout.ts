import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/AdvancedLogger";
import { ResponseHandler } from "../responses/ResponseHandler";

interface TimeoutOptions {
  timeout?: number; // in milliseconds
  message?: string;
}

/**
 * Request timeout middleware
 * Prevents requests from hanging indefinitely
 */
export const requestTimeout = (options: TimeoutOptions = {}) => {
  const timeout = options.timeout || 30000; // 30 seconds default
  const message = options.message || "Request timeout";

  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = (req as any).id;

    // Set timeout
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.error("⏱️  Request timeout", {
          requestId,
          path: req.path,
          method: req.method,
          timeout: `${timeout}ms`,
          userId: (req as any).user?.userId,
        });

        ResponseHandler.error(
          res,
          408,
          "REQUEST_TIMEOUT",
          message,
          { timeout: `${timeout}ms` },
          requestId
        );
      }
    }, timeout);

    // Clear timeout when response finishes
    res.on("finish", () => {
      clearTimeout(timer);
    });

    // Clear timeout on error
    res.on("close", () => {
      clearTimeout(timer);
    });

    next();
  };
};

/**
 * Route-specific timeout
 * Use for routes that need different timeout values
 */
export const timeoutRoute = (timeoutMs: number) => {
  return requestTimeout({ timeout: timeoutMs });
};
