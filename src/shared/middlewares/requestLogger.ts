import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

interface RequestWithId extends Request {
  id: string;
  user?: {
    userId: string;
    email: string;
    workspaceId: string;
  };
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const extReq = req as RequestWithId;
  extReq.id = uuidv4();
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    logger.http("HTTP Request", {
      requestId: extReq.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      userId: extReq.user?.userId,
    });
  });

  next();
};
