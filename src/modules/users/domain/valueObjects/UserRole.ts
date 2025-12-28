// src/modules/users/domain/valueObjects/UserRole.ts
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

// src/modules/users/domain/events/UserCreatedEvent.ts
import { BaseDomainEvent } from '../../../../core/domain/DomainEvent';

export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    public readonly data: {
      email: string;
      firstName: string;
      lastName: string;
    }
  ) {
    super(userId, 'UserCreated', 1);
  }
}
