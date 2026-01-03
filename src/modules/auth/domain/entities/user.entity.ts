// src/modules/auth/domain/entities/user.entity.ts

import { v4 as uuidv4 } from 'uuid';
import { Email } from '../value-objects/email.value-object';
import { RefreshToken } from '../value-objects/refresh-token.value-object';

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

// src/modules/auth/domain/entities/session.entity.ts

import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../value-objects/refresh-token.value-object';

export interface SessionProps {
  id?: string;
  userId: string;
  refreshToken: RefreshToken;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Session {
  private readonly id: string;
  private readonly userId: string;
  private refreshToken: RefreshToken;
  private ipAddress?: string;
  private userAgent?: string;
  private isRevoked: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: SessionProps) {
    this.id = props.id || uuidv4();
    this.userId = props.userId;
    this.refreshToken = props.refreshToken;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.isRevoked = props.isRevoked;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  static create(
    userId: string,
    refreshToken: RefreshToken,
    ipAddress?: string,
    userAgent?: string
  ): Session {
    return new Session({
      userId,
      refreshToken,
      ipAddress,
      userAgent,
      isRevoked: false,
    });
  }

  static fromPersistence(props: SessionProps): Session {
    return new Session(props);
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getRefreshToken(): RefreshToken {
    return this.refreshToken;
  }

  getIpAddress(): string | undefined {
    return this.ipAddress;
  }

  getUserAgent(): string | undefined {
    return this.userAgent;
  }

  getIsRevoked(): boolean {
    return this.isRevoked;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  revoke(): void {
    this.isRevoked = true;
    this.touch();
  }

  isValid(): boolean {
    return !this.isRevoked && !this.refreshToken.isExpired();
  }

  rotate(newRefreshToken: RefreshToken): void {
    this.refreshToken = newRefreshToken;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  toObject(): SessionProps {
    return {
      id: this.id,
      userId: this.userId,
      refreshToken: this.refreshToken,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      isRevoked: this.isRevoked,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
