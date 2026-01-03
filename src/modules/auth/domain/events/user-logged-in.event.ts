// src/modules/auth/domain/events/user-logged-in.event.ts

export interface UserLoggedInEventPayload {
  userId: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  loggedInAt: Date;
}

export class UserLoggedInEvent {
  readonly eventName = 'user.logged_in';
  readonly occurredAt: Date;
  readonly payload: UserLoggedInEventPayload;

  constructor(payload: UserLoggedInEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
