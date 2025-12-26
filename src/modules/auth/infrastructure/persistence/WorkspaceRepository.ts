import { IWorkspaceRepository } from "../../domain/repositories/IWorkspaceRepository";
import { Workspace } from "../../domain/aggregates/Workspace.aggregate";
import { WorkspaceModel } from "./models/WorkspaceModel";
import { WorkspaceMapper } from "./mappers/WorkspaceMapper";
import { UnitOfWork } from "../../../../core/infrastructure/persistence/UnitOfWork";

export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async findById(id: string): Promise<Workspace | null> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const workspaceModel = await WorkspaceModel.findByPk(id, { transaction });

    if (!workspaceModel) {
      return null;
    }

    return WorkspaceMapper.toDomain(workspaceModel);
  }

  async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const workspaceModels = await WorkspaceModel.findAll({
      where: { ownerId },
      transaction,
    });

    return workspaceModels.map((model) => WorkspaceMapper.toDomain(model));
  }

  async existsByName(name: string): Promise<boolean> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const count = await WorkspaceModel.count({
      where: { name },
      transaction,
    });

    return count > 0;
  }

  async save(workspace: Workspace): Promise<void> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    const persistenceData = WorkspaceMapper.toPersistence(workspace);

    const existingWorkspace = await WorkspaceModel.findByPk(workspace.id, {
      transaction,
    });

    if (existingWorkspace) {
      await existingWorkspace.update(persistenceData, { transaction });
    } else {
      await WorkspaceModel.create(persistenceData as any, { transaction });
    }
  }

  async delete(id: string): Promise<void> {
    const transaction = this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;

    await WorkspaceModel.destroy({
      where: { id },
      transaction,
    });
  }
}
