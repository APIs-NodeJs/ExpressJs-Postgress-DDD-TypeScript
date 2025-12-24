import { Request, Response } from "express";
import { APP_CONSTANTS } from "../../../config/constants";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(APP_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.id,
    },
  });
}
