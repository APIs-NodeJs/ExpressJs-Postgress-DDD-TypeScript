import {
  Workspace,
  WorkspaceStatus,
  WorkspaceMember,
  MemberRole,
} from "../../../domain/aggregates/Workspace.aggregate";
import { WorkspaceModel } from "../models/WorkspaceModel";
import { Email } from "../../../domain/value-objects/Email.vo";

interface WorkspaceMemberPersistence {
  userId: string;
  email: string;
  role: string;
  joinedAt: string;
}

export class WorkspaceMapper {
  static toDomain(model: WorkspaceModel): Workspace {
    // Parse members from JSON field
    const membersData: WorkspaceMemberPersistence[] =
      typeof model.members === "string"
        ? JSON.parse(model.members)
        : model.members || [];

    const members: WorkspaceMember[] = membersData.map((m) => {
      const emailOrError = Email.create(m.email);
      if (emailOrError.isFailure) {
        throw new Error(`Invalid member email: ${m.email}`);
      }

      return {
        userId: m.userId,
        email: emailOrError.getValue(),
        role: m.role as MemberRole,
        joinedAt: new Date(m.joinedAt),
      };
    });

    // Parse settings
    const settings =
      typeof model.settings === "string"
        ? JSON.parse(model.settings)
        : model.settings;

    const workspaceOrError = Workspace.reconstitute(
      model.id,
      model.name,
      model.ownerId,
      model.status as WorkspaceStatus,
      members,
      settings,
      model.createdAt,
      model.updatedAt
    );

    if (workspaceOrError.isFailure) {
      throw new Error(
        `Failed to reconstitute workspace: ${workspaceOrError.error}`
      );
    }

    return workspaceOrError.getValue();
  }

  static toPersistence(workspace: Workspace): Partial<WorkspaceModel> {
    const membersData: WorkspaceMemberPersistence[] = workspace.members.map(
      (member) => ({
        userId: member.userId,
        email: member.email.value,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
      })
    );

    return {
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.ownerId,
      status: workspace.status,
      memberCount: workspace.memberCount,
      members: JSON.stringify(membersData),
      settings: JSON.stringify(workspace.settings),
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }
}
