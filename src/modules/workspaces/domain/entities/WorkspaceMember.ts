// src/modules/workspaces/domain/entities/WorkspaceMember.ts
import { Entity } from '../../../../core/domain/Entity';
import { UniqueEntityID } from '../../../../core/domain/Identifier';
import { Result } from '../../../../core/domain/Result';
import { WorkspaceRole } from '../valueObjects/WorkspaceRole';
import { Permission } from '../valueObjects/Permission';

interface WorkspaceMemberProps {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  permissions: Permission[];
  joinedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkspaceMember extends Entity<string> {
  private props: WorkspaceMemberProps;

  private constructor(props: WorkspaceMemberProps, id?: UniqueEntityID) {
    super(
      id?.toValue() || new UniqueEntityID().toValue(),
      props.createdAt,
      props.updatedAt
    );
    this.props = props;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get role(): WorkspaceRole {
    return this.props.role;
  }

  get permissions(): readonly Permission[] {
    return this.props.permissions;
  }

  get joinedAt(): Date {
    return this.props.joinedAt;
  }

  public static create(
    props: {
      workspaceId: string;
      userId: string;
      role: WorkspaceRole;
      permissions?: Permission[];
    },
    id?: UniqueEntityID
  ): Result<WorkspaceMember> {
    if (!props.workspaceId) {
      return Result.fail<WorkspaceMember>('Workspace ID is required');
    }

    if (!props.userId) {
      return Result.fail<WorkspaceMember>('User ID is required');
    }

    const member = new WorkspaceMember(
      {
        workspaceId: props.workspaceId,
        userId: props.userId,
        role: props.role,
        permissions: props.permissions || [],
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id
    );

    return Result.ok<WorkspaceMember>(member);
  }

  public changeRole(newRole: WorkspaceRole): void {
    this.props.role = newRole;
    this.touch();
  }

  public hasPermission(permission: Permission): boolean {
    return this.props.permissions.includes(permission);
  }

  public addPermission(permission: Permission): void {
    if (!this.hasPermission(permission)) {
      this.props.permissions.push(permission);
      this.touch();
    }
  }

  public removePermission(permission: Permission): void {
    const index = this.props.permissions.indexOf(permission);
    if (index > -1) {
      this.props.permissions.splice(index, 1);
      this.touch();
    }
  }
}
