// src/modules/workspace/domain/events/invitation-sent.event.ts

export interface InvitationSentEventPayload {
  workspaceId: string;
  email: string;
  role: string;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  sentAt: Date;
}

export class InvitationSentEvent {
  readonly eventName = 'workspace.invitation_sent';
  readonly occurredAt: Date;
  readonly payload: InvitationSentEventPayload;

  constructor(payload: InvitationSentEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
