import { WorkspaceModel } from '../../../../infrastructure/database/models/WorkspaceModel';
import { Workspace } from '../../domain/entities/Workspace';

export class WorkspaceRepository {
  async create(workspace: Workspace): Promise<Workspace> {
    const model = await WorkspaceModel.create({
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.ownerId,
    });
    return Workspace.create(model.toJSON() as any);
  }
}
