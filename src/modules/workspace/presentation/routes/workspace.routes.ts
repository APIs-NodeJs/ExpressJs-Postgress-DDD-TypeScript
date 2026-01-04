// src/modules/workspace/presentation/routes/workspace.routes.ts

import { Router } from 'express';
import { WorkspaceController } from '../controllers/workspace.controller';
import { validateBody, validateParams, asyncHandler } from '@core/middleware';
import { authenticate } from '@modules/auth/presentation/middleware/authenticate.middleware';
import { workspaceAccess } from '../middleware/workspace-access.middleware';
import {
  CreateWorkspaceSchema,
  AddMemberSchema,
  InviteMemberSchema,
  WorkspaceIdParamSchema,
  InvitationTokenParamSchema,
  UserIdParamSchema,
} from '../validators/workspace.validator';

export function createWorkspaceRoutes(workspaceController: WorkspaceController): Router {
  const router = Router();

  /**
   * @route   POST /api/v1/workspaces
   * @desc    Create a new workspace
   * @access  Private
   */
  router.post(
    '/',
    authenticate,
    validateBody(CreateWorkspaceSchema),
    asyncHandler(workspaceController.createWorkspace)
  );

  /**
   * @route   GET /api/v1/workspaces
   * @desc    List all workspaces for current user
   * @access  Private
   */
  router.get('/', authenticate, asyncHandler(workspaceController.listWorkspaces));

  /**
   * @route   GET /api/v1/workspaces/:workspaceId
   * @desc    Get workspace details
   * @access  Private (Members only)
   */
  router.get(
    '/:workspaceId',
    authenticate,
    validateParams(WorkspaceIdParamSchema),
    asyncHandler(workspaceController.getWorkspace)
  );

  /**
   * @route   POST /api/v1/workspaces/:workspaceId/members
   * @desc    Add member to workspace
   * @access  Private (Admin+ only)
   */
  router.post(
    '/:workspaceId/members',
    authenticate,
    validateParams(WorkspaceIdParamSchema),
    validateBody(AddMemberSchema),
    workspaceAccess(['admin', 'owner']),
    asyncHandler(workspaceController.addMember)
  );

  /**
   * @route   DELETE /api/v1/workspaces/:workspaceId/members/:userId
   * @desc    Remove member from workspace
   * @access  Private (Admin+ only)
   */
  router.delete(
    '/:workspaceId/members/:userId',
    authenticate,
    validateParams(WorkspaceIdParamSchema.merge(UserIdParamSchema)),
    workspaceAccess(['admin', 'owner']),
    asyncHandler(workspaceController.removeMember)
  );

  /**
   * @route   POST /api/v1/workspaces/:workspaceId/invitations
   * @desc    Invite member to workspace
   * @access  Private (Admin+ only)
   */
  router.post(
    '/:workspaceId/invitations',
    authenticate,
    validateParams(WorkspaceIdParamSchema),
    validateBody(InviteMemberSchema),
    workspaceAccess(['admin', 'owner']),
    asyncHandler(workspaceController.inviteMember)
  );

  /**
   * @route   POST /api/v1/invitations/:token/accept
   * @desc    Accept workspace invitation
   * @access  Private
   */
  router.post(
    '/invitations/:token/accept',
    authenticate,
    validateParams(InvitationTokenParamSchema),
    asyncHandler(workspaceController.acceptInvitation)
  );

  return router;
}
