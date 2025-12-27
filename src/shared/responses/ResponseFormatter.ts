// src/shared/responses/ResponseFormatter.ts

import {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginationMeta,
  ValidationErrorDetail,
} from "./ApiResponse.interface";

export class ResponseFormatter {
  /**
   * Format success response
   */
  static success<T>(
    data: T,
    message?: string,
    meta?: PaginationMeta | any,
    requestId?: string
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      message,
      meta,
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format paginated response
   */
  static paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string,
    requestId?: string
  ): ApiSuccessResponse<T[]> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    const meta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    };

    return {
      success: true,
      data,
      message,
      meta,
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format error response
   */
  static error(
    code: string,
    message: string,
    details?: any,
    requestId?: string,
    includeStack?: boolean
  ): ApiErrorResponse {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    // Include stack trace only in development
    if (includeStack && process.env.NODE_ENV === "development") {
      errorResponse.error.stack = new Error().stack;
    }

    return errorResponse;
  }

  /**
   * Format validation error response
   */
  static validationError(
    errors: ValidationErrorDetail[],
    requestId?: string
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: errors,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format not found error
   */
  static notFound(resource: string, requestId?: string): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `${resource} not found`,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format unauthorized error
   */
  static unauthorized(
    message: string = "Authentication required",
    requestId?: string
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format forbidden error
   */
  static forbidden(
    message: string = "Access denied",
    requestId?: string
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format conflict error
   */
  static conflict(message: string, requestId?: string): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: "CONFLICT",
        message,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format rate limit error
   */
  static rateLimitExceeded(
    message: string = "Too many requests, please try again later",
    retryAfter?: number,
    requestId?: string
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message,
        details: retryAfter ? { retryAfter } : undefined,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format internal server error
   */
  static internalError(
    message: string = "An unexpected error occurred",
    details?: any,
    requestId?: string
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message,
        details: process.env.NODE_ENV === "development" ? details : undefined,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }
}
