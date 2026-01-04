// src/modules/user/domain/value-objects/full-name.value-object.ts

import { ValidationError } from '@core/errors';

export class FullName {
  private readonly firstName: string;
  private readonly lastName: string;

  private constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

  static create(firstName: string, lastName: string): FullName {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst || trimmedFirst.length === 0) {
      throw new ValidationError('First name cannot be empty');
    }

    if (!trimmedLast || trimmedLast.length === 0) {
      throw new ValidationError('Last name cannot be empty');
    }

    if (trimmedFirst.length > 100) {
      throw new ValidationError('First name is too long');
    }

    if (trimmedLast.length > 100) {
      throw new ValidationError('Last name is too long');
    }

    // Validate characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(trimmedFirst)) {
      throw new ValidationError('First name contains invalid characters');
    }

    if (!nameRegex.test(trimmedLast)) {
      throw new ValidationError('Last name contains invalid characters');
    }

    return new FullName(trimmedFirst, trimmedLast);
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getInitials(): string {
    return `${this.firstName[0]}${this.lastName[0]}`.toUpperCase();
  }

  equals(other: FullName): boolean {
    return this.firstName === other.firstName && this.lastName === other.lastName;
  }

  toString(): string {
    return this.getFullName();
  }
}
