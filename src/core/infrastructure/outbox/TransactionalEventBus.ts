// src/core/infrastructure/outbox/TransactionalEventBus.ts
import { IEventBus, IEventHandler } from '../../application/EventBus';
import { IDomainEvent } from '../../domain/DomainEvent';
import { OutboxRepository } from './OutboxRepository';
import { Transaction } from 'sequelize';
import { Logger } from '../../utils/Logger';

export class TransactionalEventBus implements IEventBus {
  private handlers: Map<string, IEventHandler<any>[]> = new Map();
  private readonly logger: Logger;
  private readonly outboxRepository: OutboxRepository;

  constructor() {
    this.logger = new Logger('TransactionalEventBus');
    this.outboxRepository = new OutboxRepository();
  }

  public subscribe<T extends IDomainEvent>(
    eventName: string,
    handler: IEventHandler<T>
  ): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);

    this.logger.debug('Handler subscribed', { eventName });
  }

  /**
   * Save events to outbox (within transaction)
   * Events will be published later by background worker
   */
  async saveToOutbox(
    events: readonly IDomainEvent[],
    aggregateType: string,
    transaction: Transaction
  ): Promise<void> {
    if (events.length === 0) return;

    await this.outboxRepository.saveEvents(events, aggregateType, transaction);

    this.logger.info('Events saved to outbox', {
      count: events.length,
      aggregateType,
    });
  }

  /**
   * Publish event immediately (use only for non-critical events)
   */
  public async publish(event: IDomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventName);

    if (!eventHandlers || eventHandlers.length === 0) {
      this.logger.debug('No handlers for event', { eventName: event.eventName });
      return;
    }

    const promises = eventHandlers.map(handler =>
      handler.handle(event).catch(error => {
        this.logger.error('Error handling event', {
          eventName: event.eventName,
          eventId: event.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
      })
    );

    await Promise.all(promises);
  }

  /**
   * Publish all events immediately
   */
  public async publishAll(events: readonly IDomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  /**
   * Process events from outbox (called by background worker)
   */
  async processOutboxEvents(batchSize: number = 100): Promise<number> {
    const pendingEvents = await this.outboxRepository.getPendingEvents(batchSize);

    if (pendingEvents.length === 0) {
      return 0;
    }

    this.logger.info('Processing outbox events', { count: pendingEvents.length });

    let successCount = 0;

    for (const outboxEvent of pendingEvents) {
      try {
        const event = this.deserializeEvent(outboxEvent.payload);

        await this.publish(event);
        await this.outboxRepository.markAsPublished(outboxEvent.eventId);

        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        this.logger.error('Failed to process outbox event', {
          eventId: outboxEvent.eventId,
          eventName: outboxEvent.eventName,
          error: errorMessage,
        });

        await this.outboxRepository.markAsFailed(outboxEvent.eventId, errorMessage);
      }
    }

    this.logger.info('Outbox events processed', {
      total: pendingEvents.length,
      success: successCount,
      failed: pendingEvents.length - successCount,
    });

    return successCount;
  }

  /**
   * Retry failed events
   */
  async retryFailedEvents(maxAttempts: number = 5): Promise<number> {
    const failedEvents = await this.outboxRepository.getFailedEventsForRetry(maxAttempts);

    if (failedEvents.length === 0) {
      return 0;
    }

    this.logger.info('Retrying failed events', { count: failedEvents.length });

    let successCount = 0;

    for (const outboxEvent of failedEvents) {
      try {
        const event = this.deserializeEvent(outboxEvent.payload);

        await this.publish(event);
        await this.outboxRepository.markAsPublished(outboxEvent.eventId);

        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await this.outboxRepository.markAsFailed(outboxEvent.eventId, errorMessage);
      }
    }

    this.logger.info('Failed events retry complete', {
      total: failedEvents.length,
      success: successCount,
      failed: failedEvents.length - successCount,
    });

    return successCount;
  }

  /**
   * Cleanup old events
   */
  async cleanupOldEvents(olderThanDays: number = 30): Promise<number> {
    return this.outboxRepository.deleteOldPublishedEvents(olderThanDays);
  }

  /**
   * Deserialize event from storage
   */
  private deserializeEvent(payload: any): IDomainEvent {
    return payload.data;
  }
}

// Export singleton instance
export const transactionalEventBus = new TransactionalEventBus();
