// src/modules/user/domain/events/user-profile-updated.event.ts

export interface UserProfileUpdatedEventPayload {
  userId: string;
  email: string;
  changes: {
    firstName?: { old: string; new: string };
    lastName?: { old: string; new: string };
  };
  updatedAt: Date;
}

export class UserProfileUpdatedEvent {
  readonly eventName = 'user.profile_updated';
  readonly occurredAt: Date;
  readonly payload: UserProfileUpdatedEventPayload;

  constructor(payload: UserProfileUpdatedEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
