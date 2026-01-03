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
