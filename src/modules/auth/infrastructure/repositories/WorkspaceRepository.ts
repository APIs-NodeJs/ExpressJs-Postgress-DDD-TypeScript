// src/modules/auth/infrastructure/repositories/WorkspaceRepository.ts
import { Transaction } from "sequelize";
import { WorkspaceModel } from "../../../../infrastructure/database/models/WorkspaceModel";
import { Workspace } from "../../domain/entities/Workspace";

export class WorkspaceRepository {
  async findById(id: string): Promise<Workspace | null> {
    const model = await WorkspaceModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async create(
    workspace: Workspace,
    transaction?: Transaction
  ): Promise<Workspace> {
    const model = await WorkspaceModel.create(
      {
        id: workspace.id,
        name: workspace.name,
        ownerId: workspace.ownerId,
      },
      { transaction }
    );
    return this.toDomain(model);
  }

  async updateOwner(
    workspaceId: string,
    ownerId: string,
    transaction?: Transaction
  ): Promise<void> {
    await WorkspaceModel.update(
      { ownerId },
      {
        where: { id: workspaceId },
        transaction,
      }
    );
  }

  async update(
    id: string,
    updates: Partial<Workspace>,
    transaction?: Transaction
  ): Promise<Workspace | null> {
    const [affectedCount] = await WorkspaceModel.update(updates, {
      where: { id },
      transaction,
    });

    if (affectedCount === 0) {
      return null;
    }

    return this.findById(id);
  }

  async delete(id: string, transaction?: Transaction): Promise<boolean> {
    const deletedCount = await WorkspaceModel.destroy({
      where: { id },
      transaction,
    });
    return deletedCount > 0;
  }

  private toDomain(model: WorkspaceModel): Workspace {
    return Workspace.create({
      id: model.id,
      name: model.name,
      ownerId: model.ownerId,
    });
  }
}
