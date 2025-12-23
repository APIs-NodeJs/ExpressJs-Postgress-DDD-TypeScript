import { WorkspaceModel } from '../../../../infrastructure/database/models/WorkspaceModel';
import { Workspace } from '../../domain/entities/Workspace';

export class WorkspaceRepository {
  async findById(id: string): Promise<Workspace | null> {
    const workspaceModel = await WorkspaceModel.findByPk(id);
    if (!workspaceModel) return null;
    return Workspace.create(workspaceModel.toJSON());
  }

  async findByOwnerId(ownerId: string): Promise<Workspace | null> {
    const workspaceModel = await WorkspaceModel.findOne({ where: { ownerId } });
    if (!workspaceModel) return null;
    return Workspace.create(workspaceModel.toJSON());
  }

  async create(workspace: Workspace): Promise<Workspace> {
    const workspaceModel = await WorkspaceModel.create({
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.ownerId,
    });
    return Workspace.create(workspaceModel.toJSON());
  }

  async update(id: string, data: Partial<Workspace>): Promise<Workspace | null> {
    const workspaceModel = await WorkspaceModel.findByPk(id);
    if (!workspaceModel) return null;
    
    await workspaceModel.update(data);
    return Workspace.create(workspaceModel.toJSON());
  }

  async delete(id: string): Promise<boolean> {
    const result = await WorkspaceModel.destroy({ where: { id } });
    return result > 0;
  }
}
