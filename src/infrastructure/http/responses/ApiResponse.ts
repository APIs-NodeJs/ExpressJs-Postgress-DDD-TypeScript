import { Response } from "express";

export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    requestId: string;
  };
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200
  ): Response {
    const response: ApiSuccessResponse<T> = {
      data,
      message,
      meta: {
        requestId: res.locals.requestId,
        timestamp: new Date().toISOString(),
      },
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message?: string): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const response: PaginatedResponse<T> = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return res.status(200).json(response);
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode = 500,
    details?: Record<string, string[]>
  ): Response {
    const response: ApiErrorResponse = {
      error: {
        code,
        message,
        details,
        requestId: res.locals.requestId || "unknown",
      },
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(
    res: Response,
    message: string,
    details?: Record<string, string[]>
  ): Response {
    return ApiResponse.error(res, "BAD_REQUEST", message, 400, details);
  }

  static unauthorized(res: Response, message = "Unauthorized"): Response {
    return ApiResponse.error(res, "UNAUTHORIZED", message, 401);
  }

  static forbidden(res: Response, message = "Forbidden"): Response {
    return ApiResponse.error(res, "FORBIDDEN", message, 403);
  }

  static notFound(res: Response, message = "Resource not found"): Response {
    return ApiResponse.error(res, "NOT_FOUND", message, 404);
  }

  static conflict(res: Response, message: string): Response {
    return ApiResponse.error(res, "CONFLICT", message, 409);
  }

  static internalError(
    res: Response,
    message = "Internal server error"
  ): Response {
    return ApiResponse.error(res, "INTERNAL_ERROR", message, 500);
  }
}
