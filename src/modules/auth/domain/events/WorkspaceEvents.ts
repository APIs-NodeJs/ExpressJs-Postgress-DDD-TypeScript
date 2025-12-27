// src/modules/auth/domain/events/WorkspaceEvents.ts
import { BaseDomainEvent } from "../../../../core/domain/DomainEvent";

export class WorkspaceCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly name: string,
    public readonly ownerId: string,
    public readonly ownerEmail: string
  ) {
    super(workspaceId, "WorkspaceCreated");
  }
}

export class WorkspaceMemberAddedEvent extends BaseDomainEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string
  ) {
    super(workspaceId, "WorkspaceMemberAdded");
  }
}

export class WorkspaceMemberRemovedEvent extends BaseDomainEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly email: string,
    public readonly removedBy: string
  ) {
    super(workspaceId, "WorkspaceMemberRemoved");
  }
}

export class WorkspaceOwnerChangedEvent extends BaseDomainEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly oldOwnerId: string,
    public readonly newOwnerId: string,
    public readonly newOwnerEmail: string
  ) {
    super(workspaceId, "WorkspaceOwnerChanged");
  }
}

export class WorkspaceRenamedEvent extends BaseDomainEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly oldName: string,
    public readonly newName: string
  ) {
    super(workspaceId, "WorkspaceRenamed");
  }
}

export class WorkspaceSuspendedEvent extends BaseDomainEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly suspendedBy: string,
    public readonly reason?: string
  ) {
    super(workspaceId, "WorkspaceSuspended");
  }
}

export class WorkspaceActivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly activatedBy: string
  ) {
    super(workspaceId, "WorkspaceActivated");
  }
}
