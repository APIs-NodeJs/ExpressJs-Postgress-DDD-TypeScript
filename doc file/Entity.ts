import { v4 as uuidv4 } from 'uuid';

/**
 * Base Entity class implementing DDD principles
 * 
 * Key Concepts:
 * - Entities have identity (ID) that persists across changes
 * - Entities are compared by ID, not by attributes
 * - Entities encapsulate business logic
 * - Entities can emit domain events
 * 
 * @template T - Type of the entity's unique identifier
 */
export abstract class Entity<T> {
  protected readonly _id: T;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;
  private _domainEvents: IDomainEvent[] = [];

  constructor(id: T, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  /**
   * Get entity's unique identifier
   */
  get id(): T {
    return this._id;
  }

  /**
   * Get entity creation timestamp
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Get entity last update timestamp
   */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Mark entity as updated
   */
  protected touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * Compare two entities by identity
   * 
   * @param entity - Entity to compare with
   * @returns true if entities have the same ID
   */
  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof Entity)) {
      return false;
    }

    return this._id === entity._id;
  }

  /**
   * Add a domain event to be dispatched later
   * 
   * @param event - Domain event to add
   */
  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Get all domain events for this entity
   */
  public getDomainEvents(): IDomainEvent[] {
    return this._domainEvents;
  }

  /**
   * Clear all domain events after dispatching
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if entity has domain events
   */
  public hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}

/**
 * Aggregate Root marker
 * Aggregates are clusters of entities and value objects
 * that are treated as a single unit for data changes
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  // Aggregates are the only entities that can be retrieved directly from repositories
  // All changes to the aggregate's children should go through the aggregate root
}

/**
 * Domain Event interface
 * Events represent something that happened in the domain
 */
export interface IDomainEvent {
  occurredAt: Date;
  aggregateId: string;
  eventType: string;
}

/**
 * Unique Identifier base class
 */
export class UniqueEntityID {
  private value: string;

  constructor(id?: string) {
    this.value = id || uuidv4();
  }

  public equals(id?: UniqueEntityID): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof UniqueEntityID)) {
      return false;
    }
    return id.toValue() === this.value;
  }

  public toString(): string {
    return this.value;
  }

  public toValue(): string {
    return this.value;
  }
}

/**
 * Example usage:
 * 
 * ```typescript
 * // Define a User ID
 * export class UserId extends UniqueEntityID {
 *   private constructor(id?: string) {
 *     super(id);
 *   }
 * 
 *   public static create(id?: string): UserId {
 *     return new UserId(id);
 *   }
 * }
 * 
 * // Define a User entity
 * export class User extends AggregateRoot<UserId> {
 *   private constructor(
 *     id: UserId,
 *     private props: UserProps
 *   ) {
 *     super(id);
 *   }
 * 
 *   public static create(props: CreateUserProps): Result<User> {
 *     // Validation
 *     if (!props.email.isValid()) {
 *       return Result.fail('Invalid email');
 *     }
 * 
 *     const user = new User(UserId.create(), {
 *       email: props.email,
 *       name: props.name,
 *       password: props.password,
 *       role: props.role
 *     });
 * 
 *     // Emit domain event
 *     user.addDomainEvent(new UserCreatedEvent(user.id));
 * 
 *     return Result.ok(user);
 *   }
 * 
 *   public changeEmail(newEmail: Email): Result<void> {
 *     // Business logic
 *     if (!newEmail.isValid()) {
 *       return Result.fail('Invalid email');
 *     }
 * 
 *     this.props.email = newEmail;
 *     this.touch();
 *     this.addDomainEvent(new EmailChangedEvent(this.id, newEmail));
 * 
 *     return Result.ok();
 *   }
 * 
 *   // Getters
 *   get email(): Email { return this.props.email; }
 *   get name(): string { return this.props.name; }
 * }
 * ```
 */
