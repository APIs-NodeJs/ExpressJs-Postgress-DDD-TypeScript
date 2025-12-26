import {
  Workspace,
  WorkspaceStatus,
} from "../../../domain/aggregates/Workspace.aggregate";
import { WorkspaceModel } from "../models/WorkspaceModel";

export class WorkspaceMapper {
  static toDomain(model: WorkspaceModel): Workspace {
    const workspaceOrError = Workspace.create(
      model.name,
      model.ownerId,
      model.id
    );

    if (workspaceOrError.isFailure) {
      throw new Error(`Failed to create workspace: ${workspaceOrError.error}`);
    }

    const workspace = workspaceOrError.getValue();

    // Restore state
    Object.assign(workspace, {
      _createdAt: model.createdAt,
      _updatedAt: model.updatedAt,
      props: {
        name: model.name,
        ownerId: model.ownerId,
        status: model.status as WorkspaceStatus,
        memberCount: model.memberCount,
      },
    });

    return workspace;
  }

  static toPersistence(workspace: Workspace): Partial<WorkspaceModel> {
    return {
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.ownerId,
      status: workspace.status,
      memberCount: workspace.memberCount,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }
}
