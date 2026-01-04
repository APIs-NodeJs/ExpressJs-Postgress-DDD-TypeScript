// src/modules/workspace/domain/entities/workspace-member.entity.ts

import { v4 as uuidv4 } from 'uuid';
import { WorkspaceRole } from '../value-objects/workspace-role.value-object';

export interface WorkspaceMemberProps {
  id?: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkspaceMember {
  private readonly id: string;
  private readonly workspaceId: string;
  private readonly userId: string;
  private role: WorkspaceRole;
  private readonly joinedAt: Date;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: WorkspaceMemberProps) {
    this.id = props.id || uuidv4();
    this.workspaceId = props.workspaceId;
    this.userId = props.userId;
    this.role = props.role;
    this.joinedAt = props.joinedAt || new Date();
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  static create(workspaceId: string, userId: string, role: WorkspaceRole): WorkspaceMember {
    return new WorkspaceMember({
      workspaceId,
      userId,
      role,
    });
  }

  static fromPersistence(props: WorkspaceMemberProps): WorkspaceMember {
    return new WorkspaceMember(props);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getUserId(): string {
    return this.userId;
  }

  getRole(): WorkspaceRole {
    return this.role;
  }

  getJoinedAt(): Date {
    return this.joinedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic methods
  changeRole(newRole: WorkspaceRole): void {
    this.role = newRole;
    this.touch();
  }

  isOwner(): boolean {
    return this.role.isOwner();
  }

  isAdmin(): boolean {
    return this.role.isAdmin();
  }

  canManageMembers(): boolean {
    return this.role.canManageMembers();
  }

  canEditWorkspace(): boolean {
    return this.role.canEditWorkspace();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  // Convert to plain object for persistence
  toObject(): WorkspaceMemberProps {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      userId: this.userId,
      role: this.role,
      joinedAt: this.joinedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
