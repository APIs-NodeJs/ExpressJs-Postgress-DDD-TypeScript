import { Request, Response, NextFunction } from "express";
import { Logger } from "../../../shared/infrastructure/logger/logger";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    Logger.request({
      requestId: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      userId: req.user?.userId,
      ip: req.ip,
      duration,
    });
  });

  next();
}
