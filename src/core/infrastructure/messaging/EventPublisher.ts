import { DomainEvent } from "../../domain/DomainEvent";
import { eventBus } from "../../application/EventBus";

export class EventPublisher {
  public async publish(event: DomainEvent): Promise<void> {
    await eventBus.publish(event);
  }

  public async publishAll(events: DomainEvent[]): Promise<void> {
    await eventBus.publishAll(events);
  }
}
