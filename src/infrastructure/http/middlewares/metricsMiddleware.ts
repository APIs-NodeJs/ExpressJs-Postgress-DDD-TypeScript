import { Request, Response, NextFunction } from "express";
import { metricsCollector } from "../../monitoring/MetricsCollector";

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Increment request count
  metricsCollector.incrementRequests();

  // Listen for response finish
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    metricsCollector.recordResponseTime(duration);

    // Track errors
    if (res.statusCode >= 400) {
      metricsCollector.incrementErrors();
    }
  });

  next();
}
