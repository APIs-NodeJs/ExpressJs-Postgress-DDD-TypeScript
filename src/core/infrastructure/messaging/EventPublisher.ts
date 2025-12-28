import { IDomainEvent } from '../../domain/DomainEvent';
import { IEventBus } from '../../application/EventBus';
import { Logger } from '../../utils/Logger';

export interface IEventPublisher {
  publish(event: IDomainEvent): Promise<void>;
  publishAll(events: IDomainEvent[]): Promise<void>;
}

export class EventPublisher implements IEventPublisher {
  private readonly logger: Logger;

  constructor(private readonly eventBus: IEventBus) {
    this.logger = new Logger('EventPublisher');
  }

  public async publish(event: IDomainEvent): Promise<void> {
    try {
      this.logger.debug(`Publishing event: ${event.eventName}`, {
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        eventVersion: event.eventVersion,
      });

      await this.eventBus.publish(event);

      this.logger.debug(`Event published successfully: ${event.eventName}`, {
        eventId: event.eventId,
      });
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.eventName}`, {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  public async publishAll(events: IDomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      this.logger.info(`Publishing batch of ${events.length} events`);

      const results = await Promise.allSettled(
        events.map(event => this.publish(event))
      );

      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length > 0) {
        this.logger.warn(
          `${failed.length} of ${events.length} events failed to publish`
        );

        const errors = failed.map((result, index) => ({
          eventIndex: index,
          error:
            result.status === 'rejected'
              ? (result.reason instanceof Error
                  ? result.reason.message
                  : String(result.reason))
              : 'Unknown error',
        }));

        throw new Error(
          `Failed to publish ${failed.length} events: ${JSON.stringify(errors)}`
        );
      }

      this.logger.info(`Successfully published all ${events.length} events`);
    } catch (error) {
      this.logger.error('Batch event publishing failed', {
        totalEvents: events.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
