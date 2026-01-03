// src/modules/auth/domain/events/email-verified.event.ts

export interface EmailVerifiedEventPayload {
  userId: string;
  email: string;
  verifiedAt: Date;
}

export class EmailVerifiedEvent {
  readonly eventName = 'email.verified';
  readonly occurredAt: Date;
  readonly payload: EmailVerifiedEventPayload;

  constructor(payload: EmailVerifiedEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
