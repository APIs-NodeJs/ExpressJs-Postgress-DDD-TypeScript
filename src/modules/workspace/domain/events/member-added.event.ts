// src/modules/workspace/domain/events/member-added.event.ts

export interface MemberAddedEventPayload {
  workspaceId: string;
  userId: string;
  role: string;
  addedBy: string;
  addedAt: Date;
}

export class MemberAddedEvent {
  readonly eventName = 'workspace.member_added';
  readonly occurredAt: Date;
  readonly payload: MemberAddedEventPayload;

  constructor(payload: MemberAddedEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
