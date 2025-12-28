import { AppError } from '../../errors/ErrorFactory';
import { Logger } from './../../utils/Logger';
import { Request, Response } from 'express';
const logger = new Logger('ErrorHandler');

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  _res: Response
): void => {
  const requestId = req.id;
  const correlationId = req.correlationId;

  logger.error('Unexpected error', {
    requestId,
    correlationId,
    error: err.message,
    stack: err.stack,
  });

  // ...existing code...
};
