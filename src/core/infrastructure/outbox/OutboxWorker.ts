// src/core/infrastructure/outbox/OutboxWorker.ts
import { transactionalEventBus } from './TransactionalEventBus';
import { Logger } from '../../utils/Logger';

export class OutboxWorker {
  private readonly logger: Logger;
  private intervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private readonly processInterval: number;
  private readonly retryInterval: number;
  private readonly cleanupInterval: number;

  constructor(
    processInterval: number = 5000, // Process every 5 seconds
    retryInterval: number = 60000, // Retry every 1 minute
    cleanupInterval: number = 3600000 // Cleanup every 1 hour
  ) {
    this.logger = new Logger('OutboxWorker');
    this.processInterval = processInterval;
    this.retryInterval = retryInterval;
    this.cleanupInterval = cleanupInterval;
  }

  /**
   * Start the background worker
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Worker already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting outbox worker', {
      processInterval: this.processInterval,
      retryInterval: this.retryInterval,
      cleanupInterval: this.cleanupInterval,
    });

    // Process pending events
    this.intervalId = setInterval(() => {
      this.processPendingEvents();
    }, this.processInterval);

    // Retry failed events
    setInterval(() => {
      this.retryFailedEvents();
    }, this.retryInterval);

    // Cleanup old events
    setInterval(() => {
      this.cleanupOldEvents();
    }, this.cleanupInterval);

    // Process immediately on start
    this.processPendingEvents();
  }

  /**
   * Stop the background worker
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('Stopping outbox worker');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isRunning = false;
  }

  /**
   * Process pending events from outbox
   */
  private async processPendingEvents(): Promise<void> {
    try {
      const count = await transactionalEventBus.processOutboxEvents(100);

      if (count > 0) {
        this.logger.debug('Processed pending events', { count });
      }
    } catch (error) {
      this.logger.error('Error processing pending events', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Retry failed events
   */
  private async retryFailedEvents(): Promise<void> {
    try {
      const count = await transactionalEventBus.retryFailedEvents(5);

      if (count > 0) {
        this.logger.info('Retried failed events', { count });
      }
    } catch (error) {
      this.logger.error('Error retrying failed events', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cleanup old published events
   */
  private async cleanupOldEvents(): Promise<void> {
    try {
      const count = await transactionalEventBus.cleanupOldEvents(30);

      if (count > 0) {
        this.logger.info('Cleaned up old events', { count });
      }
    } catch (error) {
      this.logger.error('Error cleaning up old events', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; config: any } {
    return {
      isRunning: this.isRunning,
      config: {
        processInterval: this.processInterval,
        retryInterval: this.retryInterval,
        cleanupInterval: this.cleanupInterval,
      },
    };
  }
}

// Export singleton instance
export const outboxWorker = new OutboxWorker();
