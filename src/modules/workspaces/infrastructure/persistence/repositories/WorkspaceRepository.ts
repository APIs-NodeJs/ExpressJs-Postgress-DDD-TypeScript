// src/modules/workspaces/infrastructure/persistence/repositories/WorkspaceRepository.ts
import { BaseRepository } from '../../../../../core/infrastructure/persistence/BaseRepository';
import { Workspace } from '../../../domain/entities/Workspace';
import { WorkspaceMember } from '../../../domain/entities/WorkspaceMember';
import { IWorkspaceRepository } from '../../../domain/repositories/IWorkspaceRepository';
import { WorkspaceModel } from '../models/WorkspaceModel';
import { WorkspaceMemberModel } from '../models/WorkspaceMemberModel';
import { UniqueEntityID } from '../../../../../core/domain/Identifier';
import { WorkspaceRole } from '../../../domain/valueObjects/WorkspaceRole';
import { Permission } from '../../../domain/valueObjects/Permission';
import {
  QueryBuilder,
  QueryOptions,
} from '../../../../../core/infrastructure/persistence/QueryBuilder';
import {
  PaginatedResult,
  PaginationMeta,
} from '../../../../../shared/types/PaginationTypes';

export class WorkspaceRepository
  extends BaseRepository<Workspace, WorkspaceModel, string>
  implements IWorkspaceRepository
{
  async findById(id: string): Promise<Workspace | null> {
    const model = await WorkspaceModel.findByPk(id, {
      include: [{ model: WorkspaceMemberModel, as: 'members' }],
      transaction: this.getTransaction(),
    });

    if (!model) return null;
    return this.toDomain(model);
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    const model = await WorkspaceModel.findOne({
      where: { slug },
      include: [{ model: WorkspaceMemberModel, as: 'members' }],
      transaction: this.getTransaction(),
    });

    if (!model) return null;
    return this.toDomain(model);
  }

  async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    const models = await WorkspaceModel.findAll({
      where: { ownerId },
      include: [{ model: WorkspaceMemberModel, as: 'members' }],
      transaction: this.getTransaction(),
    });

    return models.map(model => this.toDomain(model));
  }

  async findByMemberId(userId: string): Promise<Workspace[]> {
    const models = await WorkspaceModel.findAll({
      include: [
        {
          model: WorkspaceMemberModel,
          as: 'members',
          where: { userId },
          required: true,
        },
      ],
      transaction: this.getTransaction(),
    });

    return models.map(model => this.toDomain(model));
  }

  async search(options: QueryOptions): Promise<PaginatedResult<Workspace>> {
    const query = QueryBuilder.build(options);

    const { count, rows } = await WorkspaceModel.findAndCountAll({
      where: query.where,
      order: query.order,
      limit: query.limit,
      offset: query.offset,
      include: [{ model: WorkspaceMemberModel, as: 'members' }],
      transaction: this.getTransaction(),
    });

    const workspaces = rows.map(model => this.toDomain(model));

    const meta: PaginationMeta = {
      page: options.page || 1,
      limit: options.limit || 20,
      total: count,
      totalPages: Math.ceil(count / (options.limit || 20)),
      hasNextPage: (options.page || 1) * (options.limit || 20) < count,
      hasPreviousPage: (options.page || 1) > 1,
    };

    return {
      data: workspaces,
      meta,
    };
  }

  /**
   * Save workspace with transactional outbox pattern
   */
  async save(workspace: Workspace): Promise<void> {
    const exists = await this.exists(workspace.id);
    const persistence = this.toPersistence(workspace);

    if (exists) {
      await WorkspaceModel.update(persistence, {
        where: { id: workspace.id },
        transaction: this.getTransaction(),
      });

      // Delete existing members
      await WorkspaceMemberModel.destroy({
        where: { workspaceId: workspace.id },
        transaction: this.getTransaction(),
      });
    } else {
      await WorkspaceModel.create(persistence as any, {
        transaction: this.getTransaction(),
      });
    }

    // Re-create all members
    for (const member of workspace.members) {
      await WorkspaceMemberModel.create(
        {
          id: member.id,
          workspaceId: workspace.id,
          userId: member.userId,
          role: member.role,
          permissions: member.permissions as string[],
          joinedAt: member.joinedAt,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        } as any,
        { transaction: this.getTransaction() }
      );
    }

    // Save events to outbox if there are any
    if (workspace.domainEvents.length > 0) {
      const transaction = this.getTransaction();
      if (transaction) {
        const { transactionalEventBus } =
          await import('../../../../../core/infrastructure/outbox/TransactionalEventBus');
        await transactionalEventBus.saveToOutbox(
          workspace.domainEvents,
          'Workspace',
          transaction
        );
        workspace.clearEvents();
      }
    }
  }

  async delete(id: string): Promise<void> {
    await WorkspaceMemberModel.destroy({
      where: { workspaceId: id },
      transaction: this.getTransaction(),
    });

    await WorkspaceModel.destroy({
      where: { id },
      transaction: this.getTransaction(),
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await WorkspaceModel.count({
      where: { id },
      transaction: this.getTransaction(),
    });
    return count > 0;
  }

  protected toDomain(model: WorkspaceModel): Workspace {
    const members: WorkspaceMember[] = [];

    if (model.members && Array.isArray(model.members)) {
      for (const memberModel of model.members) {
        const memberResult = WorkspaceMember.create(
          {
            workspaceId: memberModel.workspaceId,
            userId: memberModel.userId,
            role: memberModel.role as WorkspaceRole,
            permissions: memberModel.permissions as Permission[],
          },
          new UniqueEntityID(memberModel.id)
        );

        if (memberResult.isSuccess) {
          members.push(memberResult.getValue());
        }
      }
    }

    const workspaceResult = Workspace.create(
      {
        name: model.name,
        slug: model.slug,
        ownerId: model.ownerId,
        description: model.description,
      },
      new UniqueEntityID(model.id)
    );

    if (workspaceResult.isFailure) {
      throw new Error('Failed to create workspace domain entity');
    }

    const workspace = workspaceResult.getValue();

    for (const member of members) {
      workspace.addMember(member);
    }

    return workspace;
  }

  protected toPersistence(workspace: Workspace): Partial<WorkspaceModel> {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId,
      description: workspace.description,
      isActive: workspace.isActive,
      updatedAt: workspace.updatedAt,
    };
  }
}
