export interface DomainEvent {
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly eventName: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventName: string;

  constructor(aggregateId: string, eventName: string) {
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.eventName = eventName;
  }
}
