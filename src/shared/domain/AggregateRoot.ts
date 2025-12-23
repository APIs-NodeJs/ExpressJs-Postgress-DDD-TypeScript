import { Entity } from "./Entity";

export abstract class AggregateRoot<T> extends Entity<T> {
  // Domain events would be managed here
  // private _domainEvents: DomainEvent[] = [];
}
