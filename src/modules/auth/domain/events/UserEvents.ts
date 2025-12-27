// src/modules/auth/domain/events/UserEvents.ts
import { BaseDomainEvent } from "../../../../core/domain/DomainEvent";

export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
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
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super(userId, "UserPasswordChanged");
  }
}

export class UserEmailVerifiedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super(userId, "UserEmailVerified");
  }
}

export class UserDeletedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly isHardDelete: boolean,
    public readonly deletedBy?: string
  ) {
    super(userId, "UserDeleted");
  }
}

export class UserRestoredEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super(userId, "UserRestored");
  }
}

export class UserAssignedToWorkspaceEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly previousWorkspaceId: string | null
  ) {
    super(userId, "UserAssignedToWorkspace");
  }
}

export class UserProfileUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly changes: {
      firstName?: string;
      lastName?: string;
    }
  ) {
    super(userId, "UserProfileUpdated");
  }
}

export class UserSuspendedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly suspendedBy: string,
    public readonly reason?: string
  ) {
    super(userId, "UserSuspended");
  }
}

export class UserActivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly activatedBy: string
  ) {
    super(userId, "UserActivated");
  }
}
