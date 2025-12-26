import { BaseDomainEvent } from "../../../../core/domain/DomainEvent";

export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly workspaceId: string
  ) {
    super(userId, "UserCreated");
  }
}

export class UserLoggedInEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ipAddress?: string
  ) {
    super(userId, "UserLoggedIn");
  }
}

export class UserPasswordChangedEvent extends BaseDomainEvent {
  constructor(public readonly userId: string, public readonly email: string) {
    super(userId, "UserPasswordChanged");
  }
}

export class UserEmailVerifiedEvent extends BaseDomainEvent {
  constructor(public readonly userId: string, public readonly email: string) {
    super(userId, "UserEmailVerified");
  }
}

export class WorkspaceCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly name: string,
    public readonly ownerId: string
  ) {
    super(workspaceId, "WorkspaceCreated");
  }
}
