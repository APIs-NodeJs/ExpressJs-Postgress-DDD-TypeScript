// src/modules/workspace/domain/entities/workspace-invitation.entity.ts

import { v4 as uuidv4 } from 'uuid';
import { Email } from '@modules/auth/domain/value-objects/email.value-object';
import { WorkspaceRole } from '../value-objects/workspace-role.value-object';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export interface WorkspaceInvitationProps {
  id?: string;
  workspaceId: string;
  email: Email;
  role: WorkspaceRole;
  invitedBy: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkspaceInvitation {
  private readonly id: string;
  private readonly workspaceId: string;
  private readonly email: Email;
  private role: WorkspaceRole;
  private readonly invitedBy: string;
  private readonly token: string;
  private status: InvitationStatus;
  private readonly expiresAt: Date;
  private acceptedAt?: Date;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: WorkspaceInvitationProps) {
    this.id = props.id || uuidv4();
    this.workspaceId = props.workspaceId;
    this.email = props.email;
    this.role = props.role;
    this.invitedBy = props.invitedBy;
    this.token = props.token;
    this.status = props.status;
    this.expiresAt = props.expiresAt;
    this.acceptedAt = props.acceptedAt;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  static create(
    workspaceId: string,
    email: Email,
    role: WorkspaceRole,
    invitedBy: string,
    expiresAt: Date
  ): WorkspaceInvitation {
    return new WorkspaceInvitation({
      workspaceId,
      email,
      role,
      invitedBy,
      token: uuidv4(),
      status: InvitationStatus.PENDING,
      expiresAt,
    });
  }

  static fromPersistence(props: WorkspaceInvitationProps): WorkspaceInvitation {
    return new WorkspaceInvitation(props);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getEmail(): Email {
    return this.email;
  }

  getRole(): WorkspaceRole {
    return this.role;
  }

  getInvitedBy(): string {
    return this.invitedBy;
  }

  getToken(): string {
    return this.token;
  }

  getStatus(): InvitationStatus {
    return this.status;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getAcceptedAt(): Date | undefined {
    return this.acceptedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic methods
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isPending(): boolean {
    return this.status === InvitationStatus.PENDING && !this.isExpired();
  }

  canBeAccepted(): boolean {
    return this.isPending();
  }

  accept(): void {
    if (!this.canBeAccepted()) {
      throw new Error('Invitation cannot be accepted');
    }
    this.status = InvitationStatus.ACCEPTED;
    this.acceptedAt = new Date();
    this.touch();
  }

  cancel(): void {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Only pending invitations can be cancelled');
    }
    this.status = InvitationStatus.CANCELLED;
    this.touch();
  }

  markAsExpired(): void {
    if (this.status === InvitationStatus.PENDING && this.isExpired()) {
      this.status = InvitationStatus.EXPIRED;
      this.touch();
    }
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  // Convert to plain object for persistence
  toObject(): WorkspaceInvitationProps {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      email: this.email,
      role: this.role,
      invitedBy: this.invitedBy,
      token: this.token,
      status: this.status,
      expiresAt: this.expiresAt,
      acceptedAt: this.acceptedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
