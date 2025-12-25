import { DomainEvent } from "../../../../shared/domain/DomainEvent";

export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly workspaceId: string,
    public readonly role: string
  ) {
    super();
  }

  get aggregateId(): string {
    return this.userId;
  }

  get eventName(): string {
    return "UserCreated";
  }
}

export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly sessionId: string,
    public readonly ipAddress?: string
  ) {
    super();
  }

  get aggregateId(): string {
    return this.userId;
  }

  get eventName(): string {
    return "UserLoggedIn";
  }
}

export class UserLoggedOutEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly sessionId?: string,
    public readonly logoutAll: boolean = false
  ) {
    super();
  }

  get aggregateId(): string {
    return this.userId;
  }

  get eventName(): string {
    return "UserLoggedOut";
  }
}

export class UserPasswordChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super();
  }

  get aggregateId(): string {
    return this.userId;
  }

  get eventName(): string {
    return "UserPasswordChanged";
  }
}

export class UserEmailVerifiedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super();
  }

  get aggregateId(): string {
    return this.userId;
  }

  get eventName(): string {
    return "UserEmailVerified";
  }
}

export class AccountLockedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly reason: string,
    public readonly lockedUntil: Date
  ) {
    super();
  }

  get aggregateId(): string {
    return this.userId;
  }

  get eventName(): string {
    return "AccountLocked";
  }
}
