// src/modules/user/domain/value-objects/user-status.value-object.ts

import { ValidationError } from '@core/errors';

export enum UserStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export class UserStatus {
  private readonly value: UserStatusEnum;

  private constructor(status: UserStatusEnum) {
    this.value = status;
  }

  static create(status: string): UserStatus {
    if (!Object.values(UserStatusEnum).includes(status as UserStatusEnum)) {
      throw new ValidationError('Invalid user status');
    }
    return new UserStatus(status as UserStatusEnum);
  }

  static fromEnum(status: UserStatusEnum): UserStatus {
    return new UserStatus(status);
  }

  getValue(): UserStatusEnum {
    return this.value;
  }

  isActive(): boolean {
    return this.value === UserStatusEnum.ACTIVE;
  }

  isSuspended(): boolean {
    return this.value === UserStatusEnum.SUSPENDED;
  }

  isInactive(): boolean {
    return this.value === UserStatusEnum.INACTIVE;
  }

  isPending(): boolean {
    return this.value === UserStatusEnum.PENDING_VERIFICATION;
  }

  canLogin(): boolean {
    return this.value === UserStatusEnum.ACTIVE;
  }

  equals(other: UserStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
