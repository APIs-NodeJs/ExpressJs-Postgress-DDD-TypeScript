// src/modules/auth/domain/value-objects/refresh-token.value-object.ts

import { v4 as uuidv4 } from 'uuid';

export class RefreshToken {
  private readonly value: string;
  private readonly expiresAt: Date;

  private constructor(value: string, expiresAt: Date) {
    this.value = value;
    this.expiresAt = expiresAt;
  }

  static create(expiresAt: Date): RefreshToken {
    return new RefreshToken(uuidv4(), expiresAt);
  }

  static fromExisting(value: string, expiresAt: Date): RefreshToken {
    return new RefreshToken(value, expiresAt);
  }

  getValue(): string {
    return this.value;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  equals(other: RefreshToken): boolean {
    return this.value === other.value;
  }
}
