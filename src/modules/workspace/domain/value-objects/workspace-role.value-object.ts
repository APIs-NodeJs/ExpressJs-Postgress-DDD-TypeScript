// src/modules/workspace/domain/value-objects/workspace-role.value-object.ts

import { ValidationError } from '@core/errors';

export enum WorkspaceRoleEnum {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export class WorkspaceRole {
  private readonly value: WorkspaceRoleEnum;

  private constructor(role: WorkspaceRoleEnum) {
    this.value = role;
  }

  static create(role: string): WorkspaceRole {
    if (!Object.values(WorkspaceRoleEnum).includes(role as WorkspaceRoleEnum)) {
      throw new ValidationError('Invalid workspace role');
    }
    return new WorkspaceRole(role as WorkspaceRoleEnum);
  }

  static fromEnum(role: WorkspaceRoleEnum): WorkspaceRole {
    return new WorkspaceRole(role);
  }

  static owner(): WorkspaceRole {
    return new WorkspaceRole(WorkspaceRoleEnum.OWNER);
  }

  static admin(): WorkspaceRole {
    return new WorkspaceRole(WorkspaceRoleEnum.ADMIN);
  }

  static member(): WorkspaceRole {
    return new WorkspaceRole(WorkspaceRoleEnum.MEMBER);
  }

  static guest(): WorkspaceRole {
    return new WorkspaceRole(WorkspaceRoleEnum.GUEST);
  }

  getValue(): WorkspaceRoleEnum {
    return this.value;
  }

  isOwner(): boolean {
    return this.value === WorkspaceRoleEnum.OWNER;
  }

  isAdmin(): boolean {
    return this.value === WorkspaceRoleEnum.ADMIN;
  }

  isMember(): boolean {
    return this.value === WorkspaceRoleEnum.MEMBER;
  }

  isGuest(): boolean {
    return this.value === WorkspaceRoleEnum.GUEST;
  }

  // Permission checks
  canManageMembers(): boolean {
    return this.isOwner() || this.isAdmin();
  }

  canEditWorkspace(): boolean {
    return this.isOwner() || this.isAdmin();
  }

  canDeleteWorkspace(): boolean {
    return this.isOwner();
  }

  canInviteMembers(): boolean {
    return this.isOwner() || this.isAdmin();
  }

  canChangeRoles(): boolean {
    return this.isOwner();
  }

  canRemoveMembers(): boolean {
    return this.isOwner() || this.isAdmin();
  }

  hasWriteAccess(): boolean {
    return this.value !== WorkspaceRoleEnum.GUEST;
  }

  equals(other: WorkspaceRole): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
