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
