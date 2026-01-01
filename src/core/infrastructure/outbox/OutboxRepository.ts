// src/core/infrastructure/outbox/OutboxRepository.ts
import { Transaction, Op } from 'sequelize';
import { OutboxEventModel } from './models/OutboxEventModel';
import { IDomainEvent } from '../../domain/DomainEvent';
import { Logger } from '../../utils/Logger';

export class OutboxRepository {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger('OutboxRepository');
  }

  /**
   * Save domain events to outbox table
   */
  async saveEvents(
    events: readonly IDomainEvent[],
    aggregateType: string,
    transaction: Transaction
  ): Promise<void> {
    if (events.length === 0) return;

    const outboxEvents = events.map(event => ({
      eventId: event.eventId,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      aggregateType,
      payload: {
        data: event,
        version: event.eventVersion,
      },
      status: 'PENDING' as const,
      attemptCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await OutboxEventModel.bulkCreate(outboxEvents as any, { transaction });

    this.logger.debug('Events saved to outbox', {
      count: events.length,
      aggregateType,
    });
  }

  /**
   * Get pending events (not yet published)
   */
  async getPendingEvents(limit: number = 100): Promise<OutboxEventModel[]> {
    return OutboxEventModel.findAll({
      where: {
        status: 'PENDING',
      },
      order: [['createdAt', 'ASC']],
      limit,
    });
  }

  /**
   * Get failed events that need retry
   */
  async getFailedEventsForRetry(maxAttempts: number = 5): Promise<OutboxEventModel[]> {
    return OutboxEventModel.findAll({
      where: {
        status: 'FAILED',
        attemptCount: {
          [Op.lt]: maxAttempts,
        },
      },
      order: [['lastAttemptAt', 'ASC']],
      limit: 100,
    });
  }

  /**
   * Mark event as published
   */
  async markAsPublished(eventId: string): Promise<void> {
    await OutboxEventModel.update(
      {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
      {
        where: { eventId },
      }
    );
  }

  /**
   * Mark event as failed
   */
  async markAsFailed(eventId: string, error: string): Promise<void> {
    const event = await OutboxEventModel.findOne({ where: { eventId } });

    if (!event) {
      this.logger.warn('Event not found for marking as failed', { eventId });
      return;
    }

    await OutboxEventModel.update(
      {
        status: 'FAILED',
        attemptCount: event.attemptCount + 1,
        lastAttemptAt: new Date(),
        error: error.substring(0, 1000), // Limit error message length
        updatedAt: new Date(),
      },
      {
        where: { eventId },
      }
    );
  }

  /**
   * Delete old published events (cleanup)
   */
  async deleteOldPublishedEvents(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await OutboxEventModel.destroy({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    this.logger.info('Old published events deleted', {
      count: result,
      olderThanDays,
    });

    return result;
  }

  /**
   * Get event statistics
   */
  async getStatistics(): Promise<{
    pending: number;
    published: number;
    failed: number;
    total: number;
  }> {
    const [pending, published, failed, total] = await Promise.all([
      OutboxEventModel.count({ where: { status: 'PENDING' } }),
      OutboxEventModel.count({ where: { status: 'PUBLISHED' } }),
      OutboxEventModel.count({ where: { status: 'FAILED' } }),
      OutboxEventModel.count(),
    ]);

    return { pending, published, failed, total };
  }
}
