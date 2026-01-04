// src/modules/workspace/infrastructure/repositories/workspace.repository.ts

import { IWorkspaceRepository } from '../../domain/repositories/workspace.repository.interface';
import { Workspace, WorkspaceStatus } from '../../domain/entities/workspace.entity';
import { WorkspaceName } from '../../domain/value-objects/workspace-name.value-object';
import { WorkspaceModel } from '../models/workspace.model';

export class WorkspaceRepository implements IWorkspaceRepository {
  async save(workspace: Workspace): Promise<Workspace> {
    const workspaceProps = workspace.toObject();

    const model = await WorkspaceModel.create({
      id: workspaceProps.id,
      name: workspaceProps.name.getValue(),
      slug: workspaceProps.slug,
      description: workspaceProps.description,
      owner_id: workspaceProps.ownerId,
      status: workspaceProps.status,
    });

    return this.toDomain(model);
  }

  async findById(id: string): Promise<Workspace | null> {
    const model = await WorkspaceModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    const model = await WorkspaceModel.findOne({
      where: { slug },
    });
    return model ? this.toDomain(model) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    const models = await WorkspaceModel.findAll({
      where: { owner_id: ownerId },
      order: [['created_at', 'DESC']],
    });

    return models.map((model) => this.toDomain(model));
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await WorkspaceModel.count({
      where: { slug },
    });
    return count > 0;
  }

  async update(workspace: Workspace): Promise<Workspace> {
    const workspaceProps = workspace.toObject();

    await WorkspaceModel.update(
      {
        name: workspaceProps.name.getValue(),
        slug: workspaceProps.slug,
        description: workspaceProps.description,
        status: workspaceProps.status,
      },
      {
        where: { id: workspaceProps.id },
      }
    );

    const updated = await WorkspaceModel.findByPk(workspaceProps.id);
    if (!updated) {
      throw new Error('Workspace not found after update');
    }

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await WorkspaceModel.destroy({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return WorkspaceModel.count();
  }

  private toDomain(model: WorkspaceModel): Workspace {
    return Workspace.fromPersistence({
      id: model.id,
      name: WorkspaceName.create(model.name),
      slug: model.slug,
      description: model.description,
      ownerId: model.owner_id,
      status: model.status as WorkspaceStatus,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
      deletedAt: model.deleted_at,
    });
  }
}
