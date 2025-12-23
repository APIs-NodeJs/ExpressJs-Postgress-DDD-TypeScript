import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../responses/ApiResponse";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return ApiResponse.error(
      res,
      err.code,
      err.message,
      err.statusCode,
      err.details
    );
  }

  return ApiResponse.internalError(res);
};
