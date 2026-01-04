// src/modules/workspace/domain/events/invitation-accepted.event.ts

export interface InvitationAcceptedEventPayload {
  workspaceId: string;
  userId: string;
  email: string;
  role: string;
  acceptedAt: Date;
}

export class InvitationAcceptedEvent {
  readonly eventName = 'workspace.invitation_accepted';
  readonly occurredAt: Date;
  readonly payload: InvitationAcceptedEventPayload;

  constructor(payload: InvitationAcceptedEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
