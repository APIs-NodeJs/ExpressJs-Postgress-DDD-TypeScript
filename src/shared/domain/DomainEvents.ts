import { DomainEvent } from "./DomainEvent";
import { Logger } from "../infrastructure/logger/logger";

type EventHandler = (event: DomainEvent) => void | Promise<void>;

export class DomainEvents {
  private static handlers: Map<string, EventHandler[]> = new Map();
  private static markedAggregates: DomainEvent[] = [];

  /**
   * Register a handler for a specific event type
   */
  static register(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);

    Logger.debug("Event handler registered", { eventName });
  }

  /**
   * Mark events for dispatch
   */
  static markForDispatch(events: DomainEvent[]): void {
    this.markedAggregates.push(...events);
  }

  /**
   * Dispatch all marked events
   */
  static async dispatchEvents(): Promise<void> {
    const events = [...this.markedAggregates];
    this.markedAggregates = [];

    for (const event of events) {
      await this.dispatch(event);
    }
  }

  /**
   * Dispatch a single event
   */
  private static async dispatch(event: DomainEvent): Promise<void> {
    const eventName = event.eventName;
    const handlers = this.handlers.get(eventName) || [];

    Logger.debug("Dispatching domain event", {
      eventName,
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      handlerCount: handlers.length,
    });

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        Logger.error("Error in domain event handler", error, {
          eventName,
          eventId: event.eventId,
        });
      }
    }
  }

  /**
   * Clear all handlers (useful for testing)
   */
  static clearHandlers(): void {
    this.handlers.clear();
    this.markedAggregates = [];
  }
}
