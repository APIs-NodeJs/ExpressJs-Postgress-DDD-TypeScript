// src/modules/workspaces/domain/entities/Workspace.ts
import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { UniqueEntityID } from '../../../../core/domain/Identifier';
import { Result } from '../../../../core/domain/Result';
import { WorkspaceMember } from './WorkspaceMember';
import { WorkspaceCreatedEvent } from '../events/WorkspaceCreatedEvent';
import { MemberAddedToWorkspaceEvent } from '../events/MemberAddedToWorkspaceEvent';

interface WorkspaceProps {
  name: string;
  slug: string;
  ownerId: string;
  description?: string;
  isActive: boolean;
  members: WorkspaceMember[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Workspace extends AggregateRoot<string> {
  private props: WorkspaceProps;

  private constructor(props: WorkspaceProps, id?: UniqueEntityID) {
    super(
      id?.toValue() || new UniqueEntityID().toValue(),
      props.createdAt,
      props.updatedAt
    );
    this.props = props;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get members(): readonly WorkspaceMember[] {
    return this.props.members;
  }

  public static create(
    props: {
      name: string;
      slug: string;
      ownerId: string;
      description?: string;
    },
    id?: UniqueEntityID
  ): Result<Workspace> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Workspace>('Workspace name is required');
    }

    if (!props.slug || props.slug.trim().length === 0) {
      return Result.fail<Workspace>('Workspace slug is required');
    }

    if (!props.ownerId || props.ownerId.trim().length === 0) {
      return Result.fail<Workspace>('Owner ID is required');
    }

    const workspace = new Workspace(
      {
        name: props.name.trim(),
        slug: props.slug.toLowerCase().trim(),
        ownerId: props.ownerId,
        description: props.description?.trim(),
        isActive: true,
        members: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id
    );

    if (!id) {
      workspace.addDomainEvent(
        new WorkspaceCreatedEvent(workspace.id, {
          name: props.name,
          slug: props.slug,
          ownerId: props.ownerId,
        })
      );
    }

    return Result.ok<Workspace>(workspace);
  }

  public addMember(member: WorkspaceMember): Result<void> {
    const existingMember = this.props.members.find(m => m.userId === member.userId);
    if (existingMember) {
      return Result.fail<void>('User is already a member of this workspace');
    }

    this.props.members.push(member);
    this.touch();

    this.addDomainEvent(
      new MemberAddedToWorkspaceEvent(this.id, {
        userId: member.userId,
        role: member.role,
      })
    );

    return Result.ok<void>();
  }

  public removeMember(userId: string): Result<void> {
    if (userId === this.props.ownerId) {
      return Result.fail<void>('Cannot remove workspace owner');
    }

    const index = this.props.members.findIndex(m => m.userId === userId);
    if (index === -1) {
      return Result.fail<void>('User is not a member of this workspace');
    }

    this.props.members.splice(index, 1);
    this.touch();

    return Result.ok<void>();
  }

  public getMember(userId: string): WorkspaceMember | undefined {
    return this.props.members.find(m => m.userId === userId);
  }

  public isOwner(userId: string): boolean {
    return this.props.ownerId === userId;
  }

  public isMember(userId: string): boolean {
    return this.isOwner(userId) || this.props.members.some(m => m.userId === userId);
  }

  public updateName(name: string): Result<void> {
    if (!name || name.trim().length === 0) {
      return Result.fail<void>('Workspace name cannot be empty');
    }

    this.props.name = name.trim();
    this.touch();

    return Result.ok<void>();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }
}
