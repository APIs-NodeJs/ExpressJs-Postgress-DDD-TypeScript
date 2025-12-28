// src/modules/workspaces/presentation/controllers/WorkspaceController.ts
import { Request, Response } from 'express';
import { ResponseHandler } from '../../../../shared/responses/ResponseHandler';
import { CreateWorkspaceUseCase } from '../../application/useCases/CreateWorkspaceUseCase';
import { AddMemberToWorkspaceUseCase } from '../../application/useCases/AddMemberToWorkspaceUseCase';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { AuthenticatedRequest } from '../../../../shared/middlewares/authenticate';

export class WorkspaceController {
  constructor(
    private createWorkspaceUseCase: CreateWorkspaceUseCase,
    private addMemberToWorkspaceUseCase: AddMemberToWorkspaceUseCase,
    private workspaceRepository: IWorkspaceRepository
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).id;
    const authReq = req as AuthenticatedRequest;

    const result = await this.createWorkspaceUseCase.execute({
      name: req.body.name,
      description: req.body.description,
      ownerId: authReq.user.userId,
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

    ResponseHandler.created(
      res,
      result.getValue(),
      'Workspace created successfully',
      requestId
    );
  }

  async getById(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).id;
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
    const requestId = (req as any).id;
    const authReq = req as AuthenticatedRequest;

    const ownedWorkspaces = await this.workspaceRepository.findByOwnerId(
      authReq.user.userId
    );
    const memberWorkspaces = await this.workspaceRepository.findByMemberId(
      authReq.user.userId
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
          isOwner: w.isOwner(authReq.user.userId),
          memberCount: w.members.length + 1,
          createdAt: w.createdAt,
        })),
      },
      'Workspaces retrieved successfully',
      requestId
    );
  }

  async addMember(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).id;
    const { workspaceId } = req.params;

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

    ResponseHandler.created(
      res,
      result.getValue(),
      'Member added successfully',
      requestId
    );
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).id;
    const { workspaceId, userId } = req.params;

    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      ResponseHandler.notFound(res, 'Workspace', requestId);
      return;
    }

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

    ResponseHandler.ok(
      res,
      { message: 'Member removed successfully' },
      'Member removed successfully',
      requestId
    );
  }
}
