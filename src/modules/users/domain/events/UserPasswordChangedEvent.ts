// src/modules/users/domain/events/UserPasswordChangedEvent.ts
import { BaseDomainEvent } from '../../../../core/domain/DomainEvent';

export class UserPasswordChangedEvent extends BaseDomainEvent {
  constructor(userId: string) {
    super(userId, 'UserPasswordChanged', 1);
  }
}
