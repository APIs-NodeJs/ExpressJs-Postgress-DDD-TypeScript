// src/core/infrastructure/decorators/TransactionDecorator.ts
import { IUnitOfWork } from '../../application/ports/IUnitOfWork';
import { Result } from '../../domain/Result';
import { Logger } from '../../utils/Logger';

/**
 * Enhanced Transactional decorator with:
 * - Better error handling
 * - Nested transaction support
 * - Retry logic
 * - Performance monitoring
 */
export interface TransactionalOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  isolationLevel?:
    | 'READ_UNCOMMITTED'
    | 'READ_COMMITTED'
    | 'REPEATABLE_READ'
    | 'SERIALIZABLE';
}

export function Transactional(options: TransactionalOptions = {}) {
  const { retries = 0, retryDelay = 1000, timeout = 30000 } = options;

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`Transaction:${target.constructor.name}.${propertyName}`);

    descriptor.value = async function (...args: any[]) {
      // Get unit of work from the instance
      const unitOfWork: IUnitOfWork | undefined = (this as any).unitOfWork;

      if (!unitOfWork) {
        logger.error('Unit of work not found on instance');
        throw new Error(
          'Transactional decorator requires unitOfWork property on instance'
        );
      }

      // Check if already in a transaction (nested transaction support)
      const alreadyInTransaction = unitOfWork.isActive();

      if (alreadyInTransaction) {
        logger.debug('Already in transaction, using existing transaction');
        return originalMethod.apply(this, args);
      }

      // Execute with retry logic
      let lastError: Error | undefined;
      const startTime = Date.now();

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          // Start transaction
          await unitOfWork.start();
          logger.debug('Transaction started', { attempt: attempt + 1 });

          // Set timeout if specified
          const timeoutPromise = timeout
            ? new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Transaction timeout')), timeout);
              })
            : null;

          // Execute method
          const methodPromise = originalMethod.apply(this, args);
          const result = timeoutPromise
            ? await Promise.race([methodPromise, timeoutPromise])
            : await methodPromise;

          // Check if result is a failure (for Result pattern)
          if (result instanceof Result && result.isFailure) {
            await unitOfWork.rollback();
            logger.debug('Transaction rolled back (business logic failure)', {
              error: result.getErrorValue(),
              attempt: attempt + 1,
              duration: Date.now() - startTime,
            });
            return result;
          }

          // Commit transaction
          await unitOfWork.commit();

          const duration = Date.now() - startTime;
          logger.debug('Transaction committed successfully', {
            attempt: attempt + 1,
            duration,
          });

          // Log slow transactions
          if (duration > 5000) {
            logger.warn('Slow transaction detected', {
              duration,
              method: propertyName,
            });
          }

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Rollback transaction
          try {
            await unitOfWork.rollback();
            logger.debug('Transaction rolled back (error)', {
              error: lastError.message,
              attempt: attempt + 1,
            });
          } catch (rollbackError) {
            logger.error('Failed to rollback transaction', {
              rollbackError:
                rollbackError instanceof Error
                  ? rollbackError.message
                  : String(rollbackError),
            });
          }

          // Check if error is retryable
          if (attempt < retries && this.isRetryableError(lastError)) {
            logger.warn('Retrying transaction', {
              attempt: attempt + 1,
              maxRetries: retries,
              delay: retryDelay,
              error: lastError.message,
            });

            // Wait before retry
            await this.delay(retryDelay * (attempt + 1));
            continue;
          }

          // No more retries or non-retryable error
          logger.error('Transaction failed', {
            error: lastError.message,
            attempts: attempt + 1,
            duration: Date.now() - startTime,
          });

          throw lastError;
        }
      }

      // Should never reach here, but just in case
      throw lastError || new Error('Transaction failed after all retries');
    };

    // Add helper methods to descriptor
    descriptor.value.isRetryableError = function (error: Error): boolean {
      // Retry on deadlock, serialization failure, connection errors
      const retryableMessages = [
        'deadlock',
        'serialization failure',
        'connection',
        'timeout',
        'lock wait timeout',
      ];

      return retryableMessages.some(msg => error.message.toLowerCase().includes(msg));
    };

    descriptor.value.delay = function (ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    };

    return descriptor;
  };
}

/**
 * Simpler version without retry logic (for read-only operations)
 */
export function ReadTransaction() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const logger = new Logger(
      `ReadTransaction:${target.constructor.name}.${propertyName}`
    );

    descriptor.value = async function (...args: any[]) {
      const unitOfWork: IUnitOfWork | undefined = (this as any).unitOfWork;

      if (!unitOfWork) {
        logger.error('Unit of work not found on instance');
        throw new Error(
          'ReadTransaction decorator requires unitOfWork property on instance'
        );
      }

      // If already in transaction, just execute
      if (unitOfWork.isActive()) {
        return originalMethod.apply(this, args);
      }

      try {
        await unitOfWork.start();
        const result = await originalMethod.apply(this, args);
        await unitOfWork.commit();
        return result;
      } catch (error) {
        await unitOfWork.rollback();
        logger.error('Read transaction failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    return descriptor;
  };
}
