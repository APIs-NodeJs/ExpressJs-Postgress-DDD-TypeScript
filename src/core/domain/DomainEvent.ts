import { randomUUID } from 'crypto';

export interface IDomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly eventName: string;
  readonly eventVersion: number;
}

export abstract class BaseDomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventName: string;
  public readonly eventVersion: number;

  constructor(
    aggregateId: string,
    eventName: string,
    eventVersion: number = 1
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.eventName = eventName;
    this.eventVersion = eventVersion;
  }
}
