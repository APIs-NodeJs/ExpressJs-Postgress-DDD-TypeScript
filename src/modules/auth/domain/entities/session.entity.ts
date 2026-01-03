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
