// src/core/application/EventBus.ts
import { IDomainEvent } from '../domain/DomainEvent';

export interface IEventHandler<T extends IDomainEvent> {
  handle(event: T): Promise<void>;
}

export interface IEventBus {
  subscribe<T extends IDomainEvent>(eventName: string, handler: IEventHandler<T>): void;
  publish(event: IDomainEvent): Promise<void>;
  publishAll(events: readonly IDomainEvent[]): Promise<void>; // Changed to readonly
}

export class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, IEventHandler<any>[]> = new Map();

  public subscribe<T extends IDomainEvent>(
    eventName: string,
    handler: IEventHandler<T>
  ): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
  }

  public async publish(event: IDomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventName);
    if (!eventHandlers || eventHandlers.length === 0) {
      return;
    }

    const promises = eventHandlers.map(handler =>
      handler.handle(event).catch(error => {
        console.error(`Error handling event ${event.eventName}:`, error);
      })
    );

    await Promise.all(promises);
  }

  public async publishAll(events: readonly IDomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }
}

export const eventBus = new InMemoryEventBus();
