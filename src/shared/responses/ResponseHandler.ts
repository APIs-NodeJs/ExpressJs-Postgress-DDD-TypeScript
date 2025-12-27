import { Response } from "express";
import { ResponseFormatter } from "./ResponseFormatter";
import { HttpStatus, ValidationErrorDetail } from "./ApiResponse.interface";

export class ResponseHandler {
  /**
   * Send success response (200 OK)
   */
  static ok<T>(
    res: Response,
    data: T,
    message?: string,
    requestId?: string
  ): void {
    const response = ResponseFormatter.success(
      data,
      message,
      undefined,
      requestId
    );
    res.status(HttpStatus.OK).json(response);
  }

  /**
   * Send created response (201 Created)
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = "Resource created successfully",
    requestId?: string
  ): void {
    const response = ResponseFormatter.success(
      data,
      message,
      undefined,
      requestId
    );
    res.status(HttpStatus.CREATED).json(response);
  }

  /**
   * Send accepted response (202 Accepted)
   */
  static accepted<T>(
    res: Response,
    data: T,
    message: string = "Request accepted for processing",
    requestId?: string
  ): void {
    const response = ResponseFormatter.success(
      data,
      message,
      undefined,
      requestId
    );
    res.status(HttpStatus.ACCEPTED).json(response);
  }

  /**
   * Send no content response (204 No Content)
   */
  static noContent(res: Response): void {
    res.status(HttpStatus.NO_CONTENT).send();
  }

  /**
   * Send paginated response (200 OK)
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string,
    requestId?: string
  ): void {
    const response = ResponseFormatter.paginated(
      data,
      pagination,
      message,
      requestId
    );
    res.status(HttpStatus.OK).json(response);
  }

  /**
   * Send bad request error (400)
   */
  static badRequest(
    res: Response,
    message: string,
    details?: any,
    requestId?: string
  ): void {
    const response = ResponseFormatter.error(
      "BAD_REQUEST",
      message,
      details,
      requestId
    );
    res.status(HttpStatus.BAD_REQUEST).json(response);
  }

  /**
   * Send validation error (400)
   */
  static validationError(
    res: Response,
    errors: ValidationErrorDetail[],
    requestId?: string
  ): void {
    const response = ResponseFormatter.validationError(errors, requestId);
    res.status(HttpStatus.BAD_REQUEST).json(response);
  }

  /**
   * Send unauthorized error (401)
   */
  static unauthorized(
    res: Response,
    message: string = "Authentication required",
    requestId?: string
  ): void {
    const response = ResponseFormatter.unauthorized(message, requestId);
    res.status(HttpStatus.UNAUTHORIZED).json(response);
  }

  /**
   * Send forbidden error (403)
   */
  static forbidden(
    res: Response,
    message: string = "Access denied",
    requestId?: string
  ): void {
    const response = ResponseFormatter.forbidden(message, requestId);
    res.status(HttpStatus.FORBIDDEN).json(response);
  }

  /**
   * Send not found error (404)
   */
  static notFound(res: Response, resource: string, requestId?: string): void {
    const response = ResponseFormatter.notFound(resource, requestId);
    res.status(HttpStatus.NOT_FOUND).json(response);
  }

  /**
   * Send conflict error (409)
   */
  static conflict(res: Response, message: string, requestId?: string): void {
    const response = ResponseFormatter.conflict(message, requestId);
    res.status(HttpStatus.CONFLICT).json(response);
  }

  /**
   * Send rate limit error (429)
   */
  static rateLimitExceeded(
    res: Response,
    message?: string,
    retryAfter?: number,
    requestId?: string
  ): void {
    const response = ResponseFormatter.rateLimitExceeded(
      message,
      retryAfter,
      requestId
    );

    // Set Retry-After header if provided
    if (retryAfter) {
      res.setHeader("Retry-After", retryAfter.toString());
    }

    res.status(HttpStatus.TOO_MANY_REQUESTS).json(response);
  }

  /**
   * Send internal server error (500)
   */
  static internalError(
    res: Response,
    message?: string,
    details?: any,
    requestId?: string
  ): void {
    const response = ResponseFormatter.internalError(
      message,
      details,
      requestId
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response);
  }

  /**
   * Send custom error response
   */
  static error(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: any,
    requestId?: string
  ): void {
    const response = ResponseFormatter.error(code, message, details, requestId);
    res.status(statusCode).json(response);
  }

  /**
   * Send custom success response
   */
  static custom<T>(
    res: Response,
    statusCode: number,
    data: T,
    message?: string,
    meta?: any,
    requestId?: string
  ): void {
    const response = ResponseFormatter.success(data, message, meta, requestId);
    res.status(statusCode).json(response);
  }
}
