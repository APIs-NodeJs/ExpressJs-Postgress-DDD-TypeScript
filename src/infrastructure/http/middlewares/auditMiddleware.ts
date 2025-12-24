import { AuditLogger } from "./../../AuditLogger";
import { Request, Response, NextFunction } from "express";

const AUDITED_ACTIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Only audit sensitive operations
  if (!AUDITED_ACTIONS.has(req.method) || !req.user) {
    return next();
  }

  res.on("finish", async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        await AuditLogger.log({
          userId: req.user?.userId,
          workspaceId: req.user?.workspaceId || "unknown",
          action: `${req.method} ${req.path}`,
          resourceType: req.path.split("/")[3] || "unknown",
          resourceId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          metadata: {
            statusCode: res.statusCode,
            body: req.body,
          },
        });
      } catch (error) {
        // Don't fail request if audit fails
        console.error("Audit log failed:", error);
      }
    }
  });

  next();
}
