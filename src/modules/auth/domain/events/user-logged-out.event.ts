// src/modules/auth/domain/events/user-logged-out.event.ts

export interface UserLoggedOutEventPayload {
  userId: string;
  sessionId: string;
  loggedOutAt: Date;
}

export class UserLoggedOutEvent {
  readonly eventName = 'user.logged_out';
  readonly occurredAt: Date;
  readonly payload: UserLoggedOutEventPayload;

  constructor(payload: UserLoggedOutEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
