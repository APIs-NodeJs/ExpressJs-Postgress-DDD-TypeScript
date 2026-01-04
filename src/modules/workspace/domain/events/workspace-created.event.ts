// src/modules/workspace/domain/events/workspace-created.event.ts

export interface WorkspaceCreatedEventPayload {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  ownerId: string;
  createdAt: Date;
}

export class WorkspaceCreatedEvent {
  readonly eventName = 'workspace.created';
  readonly occurredAt: Date;
  readonly payload: WorkspaceCreatedEventPayload;

  constructor(payload: WorkspaceCreatedEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
