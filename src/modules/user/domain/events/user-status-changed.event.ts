// src/modules/user/domain/events/user-status-changed.event.ts

export interface UserStatusChangedEventPayload {
  userId: string;
  email: string;
  oldStatus: string;
  newStatus: string;
  changedAt: Date;
  reason?: string;
}

export class UserStatusChangedEvent {
  readonly eventName = 'user.status_changed';
  readonly occurredAt: Date;
  readonly payload: UserStatusChangedEventPayload;

  constructor(payload: UserStatusChangedEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
