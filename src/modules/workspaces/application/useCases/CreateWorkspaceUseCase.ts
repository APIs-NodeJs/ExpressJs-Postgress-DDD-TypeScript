// src/modules/workspaces/application/useCases/CreateWorkspaceUseCase.ts
import { IUseCase } from '../../../../core/application/UseCase';
import { Result } from '../../../../core/domain/Result';
import { Workspace } from '../../domain/entities/Workspace';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { StringUtils } from '../../../../shared/utils/index';

interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  ownerId: string;
}

interface CreateWorkspaceResponse {
  workspace: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    description?: string;
  };
}

export class CreateWorkspaceUseCase implements IUseCase<
  CreateWorkspaceRequest,
  CreateWorkspaceResponse
> {
  constructor(private workspaceRepository: IWorkspaceRepository) {}

  async execute(
    request: CreateWorkspaceRequest
  ): Promise<Result<CreateWorkspaceResponse>> {
    const slug = StringUtils.slugify(request.name);

    const existingWorkspace = await this.workspaceRepository.findBySlug(slug);
    if (existingWorkspace) {
      return Result.fail<CreateWorkspaceResponse>(
        'Workspace with this name already exists'
      );
    }

    const workspaceResult = Workspace.create({
      name: request.name,
      slug,
      ownerId: request.ownerId,
      description: request.description,
    });

    if (workspaceResult.isFailure) {
      return Result.fail<CreateWorkspaceResponse>(workspaceResult.getErrorValue());
    }

    const workspace = workspaceResult.getValue();
    await this.workspaceRepository.save(workspace);

    return Result.ok<CreateWorkspaceResponse>({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        ownerId: workspace.ownerId,
        description: workspace.description,
      },
    });
  }
}
