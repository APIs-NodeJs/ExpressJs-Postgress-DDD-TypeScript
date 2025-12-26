import { AggregateRoot } from "../../../../core/domain/AggregateRoot";
import { Result } from "../../../../core/domain/Result";
import { WorkspaceId } from "../value-objects/WorkspaceId.vo";
import { WorkspaceCreatedEvent } from "../events/UserEvents";

export enum WorkspaceStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

interface WorkspaceProps {
  name: string;
  ownerId: string;
  status: WorkspaceStatus;
  memberCount: number;
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
    return this.props.memberCount;
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

  public addMember(): void {
    this.props.memberCount++;
    this.touch();
  }

  public removeMember(): Result<void> {
    if (this.props.memberCount <= 1) {
      return Result.fail<void>("Cannot remove the last member");
    }

    this.props.memberCount--;
    this.touch();

    return Result.ok();
  }

  public rename(newName: string): Result<void> {
    if (!newName || newName.trim().length === 0) {
      return Result.fail<void>("Workspace name cannot be empty");
    }

    this.props.name = newName.trim();
    this.touch();

    return Result.ok();
  }

  public static create(
    name: string,
    ownerId: string,
    id?: string
  ): Result<Workspace> {
    if (!name || name.trim().length === 0) {
      return Result.fail<Workspace>("Workspace name is required");
    }

    if (!ownerId) {
      return Result.fail<Workspace>("Owner ID is required");
    }

    const workspaceId = id || WorkspaceId.create().getValue().value;

    const props: WorkspaceProps = {
      name: name.trim(),
      ownerId,
      status: WorkspaceStatus.ACTIVE,
      memberCount: 1,
    };

    const workspace = new Workspace(workspaceId, props);

    workspace.addDomainEvent(
      new WorkspaceCreatedEvent(workspaceId, name, ownerId)
    );

    return Result.ok(workspace);
  }
}
