import { Entity } from './Entity';
import { IDomainEvent } from './DomainEvent';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: IDomainEvent[] = [];
  private _version: number = 0;

  get domainEvents(): ReadonlyArray<IDomainEvent> {
    return this._domainEvents;
  }

  get version(): number {
    return this._version;
  }

  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  protected incrementVersion(): void {
    this._version++;
  }
}
