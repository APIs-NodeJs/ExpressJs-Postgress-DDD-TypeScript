// src/modules/workspace/domain/events/member-removed.event.ts

export interface MemberRemovedEventPayload {
  workspaceId: string;
  userId: string;
  removedBy: string;
  removedAt: Date;
}

export class MemberRemovedEvent {
  readonly eventName = 'workspace.member_removed';
  readonly occurredAt: Date;
  readonly payload: MemberRemovedEventPayload;

  constructor(payload: MemberRemovedEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
