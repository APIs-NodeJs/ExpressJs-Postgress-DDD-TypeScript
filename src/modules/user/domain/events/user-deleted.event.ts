// src/modules/user/domain/events/user-deleted.event.ts

export interface UserDeletedEventPayload {
  userId: string;
  email: string;
  deletedAt: Date;
  deletedBy?: string;
}

export class UserDeletedEvent {
  readonly eventName = 'user.deleted';
  readonly occurredAt: Date;
  readonly payload: UserDeletedEventPayload;

  constructor(payload: UserDeletedEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
