import { BaseRepository } from "@shared/infrastructure/BaseRepository";
import { IWorkspaceRepository } from "@modules/auth/domain/repositories/IWorkspaceRepository";
import { Workspace } from "@modules/auth/domain/entities/Workspace";
import { WorkspaceModel } from "../models/WorkspaceModel";

export class WorkspaceRepository
  extends BaseRepository<Workspace, WorkspaceModel>
  implements IWorkspaceRepository
{
  constructor() {
    super(WorkspaceModel);
  }

  protected toDomain(model: WorkspaceModel): Workspace {
    return Workspace.create(
      {
        name: model.name,
        slug: model.slug,
        ownerId: model.ownerId,
      },
      model.id
    );
  }

  protected toModel(domain: Workspace): Partial<WorkspaceModel> {
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      ownerId: domain.ownerId,
    };
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    const model = await this.model.findOne({
      where: { slug },
    });
    return model ? this.toDomain(model) : null;
  }
}
