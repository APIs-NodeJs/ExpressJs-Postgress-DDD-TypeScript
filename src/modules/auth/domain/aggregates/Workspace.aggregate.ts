import { AggregateRoot } from "../../../../core/domain/AggregateRoot";
import { Result } from "../../../../core/domain/Result";
import { WorkspaceId } from "../value-objects/WorkspaceId.vo";
import { Email } from "../value-objects/Email.vo";
import {
  WorkspaceCreatedEvent,
  WorkspaceMemberAddedEvent,
  WorkspaceMemberRemovedEvent,
  WorkspaceOwnerChangedEvent,
} from "../events/WorkspaceEvents";

export enum WorkspaceStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export enum MemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export interface WorkspaceMember {
  userId: string;
  email: Email;
  role: MemberRole;
  joinedAt: Date;
}

interface WorkspaceProps {
  name: string;
  ownerId: string;
  status: WorkspaceStatus;
  members: Map<string, WorkspaceMember>;
  settings: WorkspaceSettings;
}

interface WorkspaceSettings {
  maxMembers: number;
  allowInvites: boolean;
  isPublic: boolean;
}

export class Workspace extends AggregateRoot<string> {
  private props: WorkspaceProps;

  get name(): string {
    return this.props.name;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get status(): WorkspaceStatus {
    return this.props.status;
  }

  get memberCount(): number {
    return this.props.members.size;
  }

  get members(): WorkspaceMember[] {
    return Array.from(this.props.members.values());
  }

  get settings(): WorkspaceSettings {
    return this.props.settings;
  }

  private constructor(
    id: string,
    props: WorkspaceProps,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  /**
   * Business Rules
   */
  private canAddMember(): Result<void> {
    if (this.props.status !== WorkspaceStatus.ACTIVE) {
      return Result.fail<void>("Cannot add members to inactive workspace");
    }

    if (this.props.members.size >= this.props.settings.maxMembers) {
      return Result.fail<void>("Workspace has reached maximum member limit");
    }

    return Result.ok();
  }

  private isMember(userId: string): boolean {
    return this.props.members.has(userId);
  }

  private isOwner(userId: string): boolean {
    return this.props.ownerId === userId;
  }

  private hasRole(userId: string, role: MemberRole): boolean {
    const member = this.props.members.get(userId);
    return member?.role === role;
  }

  /**
   * Add member to workspace
   */
  public addMember(
    userId: string,
    email: Email,
    role: MemberRole = MemberRole.MEMBER
  ): Result<void> {
    // Validate business rules
    const canAddResult = this.canAddMember();
    if (canAddResult.isFailure) {
      return canAddResult;
    }

    // Check if already member
    if (this.isMember(userId)) {
      return Result.fail<void>("User is already a member of this workspace");
    }

    // Add member
    const member: WorkspaceMember = {
      userId,
      email,
      role,
      joinedAt: new Date(),
    };

    this.props.members.set(userId, member);
    this.touch();

    // Emit domain event
    this.addDomainEvent(
      new WorkspaceMemberAddedEvent(this.id, userId, email.value, role)
    );

    return Result.ok();
  }

  /**
   * Remove member from workspace
   */
  public removeMember(userId: string, removedBy: string): Result<void> {
    // Cannot remove owner
    if (this.isOwner(userId)) {
      return Result.fail<void>(
        "Cannot remove workspace owner. Transfer ownership first"
      );
    }

    // Check if member exists
    if (!this.isMember(userId)) {
      return Result.fail<void>("User is not a member of this workspace");
    }

    // Cannot have less than owner
    if (this.props.members.size <= 1) {
      return Result.fail<void>("Cannot remove the last member");
    }

    const member = this.props.members.get(userId)!;
    this.props.members.delete(userId);
    this.touch();

    // Emit domain event
    this.addDomainEvent(
      new WorkspaceMemberRemovedEvent(
        this.id,
        userId,
        member.email.value,
        removedBy
      )
    );

    return Result.ok();
  }

  /**
   * Change member role
   */
  public changeMemberRole(
    userId: string,
    newRole: MemberRole,
    changedBy: string
  ): Result<void> {
    // Cannot change owner role
    if (this.isOwner(userId)) {
      return Result.fail<void>(
        "Cannot change owner role. Use transferOwnership instead"
      );
    }

    // Check if member exists
    if (!this.isMember(userId)) {
      return Result.fail<void>("User is not a member of this workspace");
    }

    // Only owner or admin can change roles
    if (
      !this.isOwner(changedBy) &&
      !this.hasRole(changedBy, MemberRole.ADMIN)
    ) {
      return Result.fail<void>(
        "Insufficient permissions to change member role"
      );
    }

    const member = this.props.members.get(userId)!;
    member.role = newRole;
    this.props.members.set(userId, member);
    this.touch();

    return Result.ok();
  }

  /**
   * Transfer ownership to another member
   */
  public transferOwnership(newOwnerId: string): Result<void> {
    // New owner must be a member
    if (!this.isMember(newOwnerId)) {
      return Result.fail<void>("New owner must be a member of the workspace");
    }

    const oldOwnerId = this.props.ownerId;

    // Update old owner to admin
    const oldOwner = this.props.members.get(oldOwnerId);
    if (oldOwner) {
      oldOwner.role = MemberRole.ADMIN;
      this.props.members.set(oldOwnerId, oldOwner);
    }

    // Update new owner
    const newOwner = this.props.members.get(newOwnerId)!;
    newOwner.role = MemberRole.OWNER;
    this.props.members.set(newOwnerId, newOwner);

    this.props.ownerId = newOwnerId;
    this.touch();

    // Emit domain event
    this.addDomainEvent(
      new WorkspaceOwnerChangedEvent(
        this.id,
        oldOwnerId,
        newOwnerId,
        newOwner.email.value
      )
    );

    return Result.ok();
  }

  /**
   * Rename workspace
   */
  public rename(newName: string): Result<void> {
    if (!newName || newName.trim().length === 0) {
      return Result.fail<void>("Workspace name cannot be empty");
    }

    if (newName.length > 100) {
      return Result.fail<void>("Workspace name too long");
    }

    this.props.name = newName.trim();
    this.touch();

    return Result.ok();
  }

  /**
   * Update workspace settings
   */
  public updateSettings(settings: Partial<WorkspaceSettings>): Result<void> {
    if (settings.maxMembers !== undefined) {
      if (settings.maxMembers < this.props.members.size) {
        return Result.fail<void>(
          "Cannot set max members below current member count"
        );
      }
      if (settings.maxMembers < 1 || settings.maxMembers > 1000) {
        return Result.fail<void>("Max members must be between 1 and 1000");
      }
    }

    this.props.settings = {
      ...this.props.settings,
      ...settings,
    };
    this.touch();

    return Result.ok();
  }

  /**
   * Suspend workspace
   */
  public suspend(): Result<void> {
    if (this.props.status === WorkspaceStatus.DELETED) {
      return Result.fail<void>("Cannot suspend deleted workspace");
    }

    this.props.status = WorkspaceStatus.SUSPENDED;
    this.touch();

    return Result.ok();
  }

  /**
   * Activate workspace
   */
  public activate(): Result<void> {
    if (this.props.status === WorkspaceStatus.DELETED) {
      return Result.fail<void>("Cannot activate deleted workspace");
    }

    this.props.status = WorkspaceStatus.ACTIVE;
    this.touch();

    return Result.ok();
  }

  /**
   * Factory Methods
   */

  /**
   * Create workspace with owner as first member
   */
  public static createWithOwner(
    name: string,
    ownerId: string,
    ownerEmail: Email,
    id?: string
  ): Result<Workspace> {
    if (!name || name.trim().length === 0) {
      return Result.fail<Workspace>("Workspace name is required");
    }

    if (name.length > 100) {
      return Result.fail<Workspace>("Workspace name too long");
    }

    if (!ownerId) {
      return Result.fail<Workspace>("Owner ID is required");
    }

    const workspaceId = id || WorkspaceId.create().getValue().value;

    // Create initial member (owner)
    const members = new Map<string, WorkspaceMember>();
    members.set(ownerId, {
      userId: ownerId,
      email: ownerEmail,
      role: MemberRole.OWNER,
      joinedAt: new Date(),
    });

    const props: WorkspaceProps = {
      name: name.trim(),
      ownerId,
      status: WorkspaceStatus.ACTIVE,
      members,
      settings: {
        maxMembers: 50,
        allowInvites: true,
        isPublic: false,
      },
    };

    const workspace = new Workspace(workspaceId, props);

    workspace.addDomainEvent(
      new WorkspaceCreatedEvent(workspaceId, name, ownerId, ownerEmail.value)
    );

    return Result.ok(workspace);
  }

  /**
   * Reconstitute workspace from persistence
   */
  public static reconstitute(
    id: string,
    name: string,
    ownerId: string,
    status: WorkspaceStatus,
    members: WorkspaceMember[],
    settings: WorkspaceSettings,
    createdAt: Date,
    updatedAt: Date
  ): Result<Workspace> {
    const membersMap = new Map<string, WorkspaceMember>();
    members.forEach((member) => {
      membersMap.set(member.userId, member);
    });

    const props: WorkspaceProps = {
      name,
      ownerId,
      status,
      members: membersMap,
      settings,
    };

    return Result.ok(new Workspace(id, props, createdAt, updatedAt));
  }
}
