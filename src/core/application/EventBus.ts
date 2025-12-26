import { DomainEvent } from "../domain/DomainEvent";

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

export class EventBus {
  private handlers: Map<string, EventHandler<any>[]> = new Map();

  public subscribe<T extends DomainEvent>(
    eventName: string,
    handler: EventHandler<T>
  ): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
  }

  public async publish(event: DomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventName);
    if (!eventHandlers || eventHandlers.length === 0) {
      return;
    }

    await Promise.all(eventHandlers.map((handler) => handler.handle(event)));
  }

  public async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }
}

// Singleton instance
export const eventBus = new EventBus();
