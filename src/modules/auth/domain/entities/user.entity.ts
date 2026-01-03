// src/modules/auth/domain/entities/user.entity.ts

import { v4 as uuidv4 } from 'uuid';
import { Email } from '../value-objects/email.value-object';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export interface UserProps {
  id?: string;
  email: Email;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class User {
  private readonly id: string;
  private email: Email;
  private passwordHash: string;
  private firstName: string;
  private lastName: string;
  private status: UserStatus;
  private emailVerified: boolean;
  private lastLoginAt?: Date;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private deletedAt?: Date;

  private constructor(props: UserProps) {
    this.id = props.id || uuidv4();
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.status = props.status;
    this.emailVerified = props.emailVerified;
    this.lastLoginAt = props.lastLoginAt;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
    this.deletedAt = props.deletedAt;
  }

  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    return new User({
      ...props,
      status: props.status || UserStatus.PENDING_VERIFICATION,
      emailVerified: props.emailVerified || false,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getPasswordHash(): string {
    return this.passwordHash;
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

  getStatus(): UserStatus {
    return this.status;
  }

  isEmailVerified(): boolean {
    return this.emailVerified;
  }

  getLastLoginAt(): Date | undefined {
    return this.lastLoginAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }

  isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  // Business logic methods
  updatePassword(newPasswordHash: string): void {
    this.passwordHash = newPasswordHash;
    this.touch();
  }

  updateProfile(firstName: string, lastName: string): void {
    this.firstName = firstName;
    this.lastName = lastName;
    this.touch();
  }

  activate(): void {
    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  suspend(): void {
    this.status = UserStatus.SUSPENDED;
    this.touch();
  }

  deactivate(): void {
    this.status = UserStatus.INACTIVE;
    this.touch();
  }

  verifyEmail(): void {
    this.emailVerified = true;
    if (this.status === UserStatus.PENDING_VERIFICATION) {
      this.status = UserStatus.ACTIVE;
    }
    this.touch();
  }

  recordLogin(): void {
    this.lastLoginAt = new Date();
    this.touch();
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.deletedAt = undefined;
    this.touch();
  }

  canLogin(): boolean {
    return !this.isDeleted() && this.status === UserStatus.ACTIVE && this.emailVerified;
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  // Convert to plain object for persistence
  toObject(): UserProps {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      status: this.status,
      emailVerified: this.emailVerified,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
