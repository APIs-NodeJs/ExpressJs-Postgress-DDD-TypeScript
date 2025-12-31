// src/modules/workspaces/presentation/controllers/WorkspaceController.ts
import { Request, Response } from 'express';
import { ResponseHandler } from '../../../../shared/responses/ResponseHandler';
import { CreateWorkspaceUseCase } from '../../application/useCases/CreateWorkspaceUseCase';
import { AddMemberToWorkspaceUseCase } from '../../application/useCases/AddMemberToWorkspaceUseCase';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { IUserRepository } from '../../../users/domain/repositories/IUserRepository';
import { eventBus } from '../../../../core/application/EventBus';
import { IWorkspaceNotificationService } from '../../application/services/WorkspaceNotificationService';
import { FilterBuilder } from '../../../../shared/types/FilterTypes';

export class WorkspaceController {
  constructor(
    private createWorkspaceUseCase: CreateWorkspaceUseCase,
    private addMemberToWorkspaceUseCase: AddMemberToWorkspaceUseCase,
    private workspaceRepository: IWorkspaceRepository,
    private userRepository: IUserRepository,
    private notificationService: IWorkspaceNotificationService
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const requestId = req.id;

    if (!req.user) {
      ResponseHandler.unauthorized(res, 'Authentication required', requestId);
      return;
    }

    const result = await this.createWorkspaceUseCase.execute({
      name: req.body.name,
      description: req.body.description,
      ownerId: req.user.userId,
    });

    if (result.isFailure) {
      ResponseHandler.error(
        res,
        400,
        'WORKSPACE_CREATION_FAILED',
        result.getErrorValue(),
        undefined,
        requestId
      );
      return;
    }

    const data = result.getValue();

    // Publish domain events
    const workspace = await this.workspaceRepository.findById(data.workspace.id);
    if (workspace) {
      await eventBus.publishAll(workspace.domainEvents);
      workspace.clearEvents();
    }

    ResponseHandler.created(res, data, 'Workspace created successfully', requestId);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const requestId = req.id;
    const { workspaceId } = req.params;

    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      ResponseHandler.notFound(res, 'Workspace', requestId);
      return;
    }

    ResponseHandler.ok(
      res,
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        ownerId: workspace.ownerId,
        description: workspace.description,
        isActive: workspace.isActive,
        members: workspace.members.map(m => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          permissions: m.permissions,
          joinedAt: m.joinedAt,
        })),
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
      'Workspace retrieved successfully',
      requestId
    );
  }

  async getMyWorkspaces(req: Request, res: Response): Promise<void> {
    const requestId = req.id;

    if (!req.user) {
      ResponseHandler.unauthorized(res, 'Authentication required', requestId);
      return;
    }

    const ownedWorkspaces = await this.workspaceRepository.findByOwnerId(req.user.userId);
    const memberWorkspaces = await this.workspaceRepository.findByMemberId(
      req.user.userId
    );

    const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces];
    const uniqueWorkspaces = Array.from(
      new Map(allWorkspaces.map(w => [w.id, w])).values()
    );

    ResponseHandler.ok(
      res,
      {
        workspaces: uniqueWorkspaces.map(w => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
          ownerId: w.ownerId,
          isOwner: w.isOwner(req.user!.userId),
          memberCount: w.members.length + 1,
          createdAt: w.createdAt,
        })),
      },
      'Workspaces retrieved successfully',
      requestId
    );
  }

  /**
   * NEW: Search workspaces with filters and pagination
   */
  async search(req: Request, res: Response): Promise<void> {
    const requestId = req.id;

    if (!req.user) {
      ResponseHandler.unauthorized(res, 'Authentication required', requestId);
      return;
    }

    // Build filters
    const filters = new FilterBuilder();

    // Always show only active workspaces
    filters.equals('isActive', true);

    // Add search query if provided
    const searchQuery = req.query.query as string | undefined;
    if (searchQuery) {
      filters.like('name', searchQuery);
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

    try {
      // Use repository search method with QueryBuilder
      const result = await this.workspaceRepository.search({
        filters: filters.build(),
        sortField: sortBy,
        sortOrder,
        page,
        limit,
      });

      // Filter to only workspaces where user is owner or member
      const userWorkspaces = result.data.filter(w => w.isMember(req.user!.userId));

      ResponseHandler.paginated(
        res,
        userWorkspaces.map(w => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
          ownerId: w.ownerId,
          isOwner: w.isOwner(req.user!.userId),
          memberCount: w.members.length + 1,
          createdAt: w.createdAt,
        })),
        result.meta,
        'Workspaces found',
        requestId
      );
    } catch (error) {
      ResponseHandler.error(
        res,
        500,
        'SEARCH_FAILED',
        'Failed to search workspaces',
        error instanceof Error ? error.message : undefined,
        requestId
      );
    }
  }

  async addMember(req: Request, res: Response): Promise<void> {
    const requestId = req.id;
    const { workspaceId } = req.params;

    if (!req.user) {
      ResponseHandler.unauthorized(res, 'Authentication required', requestId);
      return;
    }

    const result = await this.addMemberToWorkspaceUseCase.execute({
      workspaceId,
      userId: req.body.userId,
      role: req.body.role,
    });

    if (result.isFailure) {
      ResponseHandler.error(
        res,
        400,
        'ADD_MEMBER_FAILED',
        result.getErrorValue(),
        undefined,
        requestId
      );
      return;
    }

    // Publish domain events (will trigger notifications via event handlers)
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (workspace) {
      await eventBus.publishAll(workspace.domainEvents);
      workspace.clearEvents();
    }

    ResponseHandler.created(
      res,
      result.getValue(),
      'Member added successfully',
      requestId
    );
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    const requestId = req.id;
    const { workspaceId, userId } = req.params;

    if (!req.user) {
      ResponseHandler.unauthorized(res, 'Authentication required', requestId);
      return;
    }

    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      ResponseHandler.notFound(res, 'Workspace', requestId);
      return;
    }

    // Get member details before removal
    const member = workspace.getMember(userId);
    const user = member ? await this.userRepository.findById(userId) : null;

    const removeResult = workspace.removeMember(userId);

    if (removeResult.isFailure) {
      ResponseHandler.error(
        res,
        400,
        'REMOVE_MEMBER_FAILED',
        removeResult.getErrorValue(),
        undefined,
        requestId
      );
      return;
    }

    await this.workspaceRepository.save(workspace);

    // Use notification service
    if (member && user) {
      await this.notificationService.notifyMemberRemoved(
        {
          id: workspace.id,
          name: workspace.name,
          ownerId: workspace.ownerId,
        },
        {
          memberId: member.id,
          userId: user.id,
          email: user.email.value,
          role: member.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        req.user.userId
      );
    }

    ResponseHandler.ok(
      res,
      { message: 'Member removed successfully' },
      'Member removed successfully',
      requestId
    );
  }

  async updateWorkspace(req: Request, res: Response): Promise<void> {
    const requestId = req.id;
    const { workspaceId } = req.params;

    if (!req.user) {
      ResponseHandler.unauthorized(res, 'Authentication required', requestId);
      return;
    }

    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      ResponseHandler.notFound(res, 'Workspace', requestId);
      return;
    }

    const changes: Record<string, any> = {};

    // Update name if provided
    if (req.body.name && req.body.name !== workspace.name) {
      const updateResult = workspace.updateName(req.body.name);
      if (updateResult.isFailure) {
        ResponseHandler.error(
          res,
          400,
          'UPDATE_FAILED',
          updateResult.getErrorValue(),
          undefined,
          requestId
        );
        return;
      }
      changes.name = req.body.name;
    }

    await this.workspaceRepository.save(workspace);

    // Notify members of the update
    if (Object.keys(changes).length > 0) {
      await this.notificationService.notifyWorkspaceUpdated(
        {
          id: workspace.id,
          name: workspace.name,
          ownerId: workspace.ownerId,
        },
        changes,
        req.user.userId
      );
    }

    ResponseHandler.ok(
      res,
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        updatedAt: workspace.updatedAt,
      },
      'Workspace updated successfully',
      requestId
    );
  }
}
