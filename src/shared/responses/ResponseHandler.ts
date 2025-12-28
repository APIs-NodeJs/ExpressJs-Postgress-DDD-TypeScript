import { Response } from 'express';
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginationMeta,
  ValidationErrorDetail,
  HttpStatus,
} from '../types/ApiTypes';

export class ResponseHandler {
  static ok<T>(
    res: Response,
    data: T,
    message?: string,
    requestId?: string
  ): void {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(HttpStatus.OK).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully',
    requestId?: string
  ): void {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(HttpStatus.CREATED).json(response);
  }

  static noContent(res: Response): void {
    res.status(HttpStatus.NO_CONTENT).send();
  }

  static paginated<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    message?: string,
    requestId?: string
  ): void {
    const response: ApiSuccessResponse<T[]> = {
      success: true,
      data,
      meta,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(HttpStatus.OK).json(response);
  }

  static error(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: any,
    requestId?: string
  ): void {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
  }

  static validationError(
    res: Response,
    errors: ValidationErrorDetail[],
    requestId?: string
  ): void {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(HttpStatus.BAD_REQUEST).json(response);
  }

  static notFound(res: Response, resource: string, requestId?: string): void {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `${resource} not found`,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(HttpStatus.NOT_FOUND).json(response);
  }

  static unauthorized(
    res: Response,
    message: string = 'Authentication required',
    requestId?: string
  ): void {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(HttpStatus.UNAUTHORIZED).json(response);
  }

  static forbidden(
    res: Response,
    message: string = 'Access denied',
    requestId?: string
  ): void {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(HttpStatus.FORBIDDEN).json(response);
  }
}
