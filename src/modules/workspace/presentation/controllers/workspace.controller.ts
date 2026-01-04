// src/modules/workspace/presentation/controllers/workspace.controller.ts

import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtil } from '@core/utils';
import { Logger } from '@core/infrastructure/logger';
import {
  CreateWorkspaceUseCase,
  GetWorkspaceUseCase,
  ListWorkspacesUseCase,
  AddMemberUseCase,
  RemoveMemberUseCase,
  InviteMemberUseCase,
  AcceptInvitationUseCase,
} from '../../application/use-cases';

const logger = new Logger('WorkspaceController');

export class WorkspaceController {
  constructor(
    private readonly createWorkspaceUseCase: CreateWorkspaceUseCase,
    private readonly getWorkspaceUseCase: GetWorkspaceUseCase,
    private readonly listWorkspacesUseCase: ListWorkspacesUseCase,
    private readonly addMemberUseCase: AddMemberUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase,
    private readonly inviteMemberUseCase: InviteMemberUseCase,
    private readonly acceptInvitationUseCase: AcceptInvitationUseCase
  ) {}

  createWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      logger.info('Create workspace request', {
        userId: req.user.userId,
        correlationId: req.correlationId,
      });

      const result = await this.createWorkspaceUseCase.execute({
        name: req.body.name,
        description: req.body.description,
        ownerId: req.user.userId,
      });

      logger.info('Workspace created successfully', {
        workspaceId: result.id,
        userId: req.user.userId,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.created(res, result, 'Workspace created successfully');
    } catch (error) {
      logger.error('Create workspace failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  getWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const workspaceId = req.params.workspaceId;

      logger.debug('Get workspace request', {
        workspaceId,
        userId: req.user.userId,
        correlationId: req.correlationId,
      });

      const result = await this.getWorkspaceUseCase.execute({
        workspaceId,
        userId: req.user.userId,
      });

      ApiResponseUtil.success(res, result);
    } catch (error) {
      logger.error('Get workspace failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  listWorkspaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      logger.debug('List workspaces request', {
        userId: req.user.userId,
        correlationId: req.correlationId,
      });

      const result = await this.listWorkspacesUseCase.execute({
        userId: req.user.userId,
      });

      ApiResponseUtil.success(res, result, 'Workspaces retrieved successfully');
    } catch (error) {
      logger.error('List workspaces failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const workspaceId = req.params.workspaceId;

      logger.info('Add member request', {
        workspaceId,
        userId: req.body.userId,
        role: req.body.role,
        addedBy: req.user.userId,
        correlationId: req.correlationId,
      });

      const result = await this.addMemberUseCase.execute({
        workspaceId,
        userId: req.body.userId,
        role: req.body.role,
        addedBy: req.user.userId,
      });

      logger.info('Member added successfully', {
        workspaceId,
        userId: req.body.userId,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.created(res, result, 'Member added successfully');
    } catch (error) {
      logger.error('Add member failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const workspaceId = req.params.workspaceId;
      const userId = req.params.userId;

      logger.info('Remove member request', {
        workspaceId,
        userId,
        removedBy: req.user.userId,
        correlationId: req.correlationId,
      });

      await this.removeMemberUseCase.execute({
        workspaceId,
        userId,
        removedBy: req.user.userId,
      });

      logger.info('Member removed successfully', {
        workspaceId,
        userId,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.success(res, undefined, 'Member removed successfully');
    } catch (error) {
      logger.error('Remove member failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  inviteMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const workspaceId = req.params.workspaceId;

      logger.info('Invite member request', {
        workspaceId,
        email: req.body.email,
        role: req.body.role,
        invitedBy: req.user.userId,
        correlationId: req.correlationId,
      });

      const result = await this.inviteMemberUseCase.execute({
        workspaceId,
        email: req.body.email,
        role: req.body.role,
        invitedBy: req.user.userId,
      });

      logger.info('Member invited successfully', {
        workspaceId,
        email: req.body.email,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.created(res, result, 'Invitation sent successfully');
    } catch (error) {
      logger.error('Invite member failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const token = req.params.token;

      logger.info('Accept invitation request', {
        token: token.substring(0, 8),
        userId: req.user.userId,
        correlationId: req.correlationId,
      });

      const result = await this.acceptInvitationUseCase.execute({
        token,
        userId: req.user.userId,
      });

      logger.info('Invitation accepted successfully', {
        workspaceId: result.workspaceId,
        userId: req.user.userId,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.success(res, result, 'Invitation accepted successfully');
    } catch (error) {
      logger.error('Accept invitation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };
}
