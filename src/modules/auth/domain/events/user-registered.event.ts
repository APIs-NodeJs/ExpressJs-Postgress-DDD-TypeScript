// src/modules/auth/domain/events/user-registered.event.ts

export interface UserRegisteredEventPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  registeredAt: Date;
}

export class UserRegisteredEvent {
  readonly eventName = 'user.registered';
  readonly occurredAt: Date;
  readonly payload: UserRegisteredEventPayload;

  constructor(payload: UserRegisteredEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
