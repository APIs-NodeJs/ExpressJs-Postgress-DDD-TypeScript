// src/modules/workspace/domain/value-objects/workspace-name.value-object.ts

import { ValidationError } from '@core/errors';

export class WorkspaceName {
  private readonly value: string;

  private constructor(name: string) {
    this.value = name;
  }

  static create(name: string): WorkspaceName {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Workspace name cannot be empty');
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      throw new ValidationError('Workspace name must be at least 3 characters long');
    }

    if (trimmedName.length > 100) {
      throw new ValidationError('Workspace name is too long');
    }

    // Allow letters, numbers, spaces, hyphens, underscores, and apostrophes
    const nameRegex = /^[a-zA-Z0-9\s\-_']+$/;
    if (!nameRegex.test(trimmedName)) {
      throw new ValidationError('Workspace name contains invalid characters');
    }

    return new WorkspaceName(trimmedName);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: WorkspaceName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  // Generate URL-friendly slug from name
  toSlug(): string {
    return this.value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
}
