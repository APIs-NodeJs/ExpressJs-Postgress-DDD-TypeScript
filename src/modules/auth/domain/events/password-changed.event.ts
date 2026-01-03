// src/modules/auth/domain/events/password-changed.event.ts

export interface PasswordChangedEventPayload {
  userId: string;
  email: string;
  changedAt: Date;
}

export class PasswordChangedEvent {
  readonly eventName = 'password.changed';
  readonly occurredAt: Date;
  readonly payload: PasswordChangedEventPayload;

  constructor(payload: PasswordChangedEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
