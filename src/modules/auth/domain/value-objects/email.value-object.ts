// src/modules/auth/domain/value-objects/email.value-object.ts

import { ValidationError } from '@core/errors';

export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  static create(email: string): Email {
    if (!email || email.trim().length === 0) {
      throw new ValidationError('Email cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
      throw new ValidationError('Invalid email format');
    }

    if (normalizedEmail.length > 255) {
      throw new ValidationError('Email is too long');
    }

    return new Email(normalizedEmail);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

// src/modules/auth/domain/value-objects/password.value-object.ts

import { ValidationError } from '@core/errors';

export class Password {
  private readonly value: string;

  private constructor(password: string) {
    this.value = password;
  }

  static create(password: string): Password {
    if (!password || password.trim().length === 0) {
      throw new ValidationError('Password cannot be empty');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new ValidationError('Password is too long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      throw new ValidationError('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new ValidationError('Password must contain at least one special character');
    }

    return new Password(password);
  }

  getValue(): string {
    return this.value;
  }
}

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
