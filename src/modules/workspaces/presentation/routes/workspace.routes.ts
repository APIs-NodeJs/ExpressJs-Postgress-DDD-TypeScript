// src/modules/workspaces/presentation/routes/workspace.routes.ts
import { Router } from 'express';
import { WorkspaceController } from '../controllers/WorkspaceController';
import { authenticate } from '../../../../shared/middlewares/authenticate';
import {
  requireWorkspaceAccess,
  requireWorkspaceRole,
} from '../../../../shared/middlewares/workspaceAccess';
import { validateRequest } from '../../../../shared/middlewares/validateRequest';
import { z } from 'zod';
import { sequelize } from '../../../../shared/config/database.config';
import { SequelizeUnitOfWork } from '../../../../core/infrastructure/persistence/SequelizeUnitOfWork';
import { WorkspaceRepository } from '../../infrastructure/persistence/repositories/WorkspaceRepository';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/UserRepository';
import { CreateWorkspaceUseCase } from '../../application/useCases/CreateWorkspaceUseCase';
import { AddMemberToWorkspaceUseCase } from '../../application/useCases/AddMemberToWorkspaceUseCase';
import { WorkspaceRole } from '../../domain/valueObjects/WorkspaceRole';
import { Permission } from '../../domain/valueObjects/Permission';

const router = Router();

const unitOfWork = new SequelizeUnitOfWork(sequelize);
const workspaceRepository = new WorkspaceRepository(unitOfWork);
const userRepository = new UserRepository(unitOfWork);

const createWorkspaceUseCase = new CreateWorkspaceUseCase(workspaceRepository);
const addMemberToWorkspaceUseCase = new AddMemberToWorkspaceUseCase(
  workspaceRepository,
  userRepository
);

const workspaceController = new WorkspaceController(
  createWorkspaceUseCase,
  addMemberToWorkspaceUseCase,
  workspaceRepository
);

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const AddMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum([WorkspaceRole.ADMIN, WorkspaceRole.MEMBER, WorkspaceRole.VIEWER]),
});

router.use(authenticate);

router.post('/', validateRequest({ body: CreateWorkspaceSchema }), (req, res) =>
  workspaceController.create(req, res)
);

router.get('/my-workspaces', (req, res) => workspaceController.getMyWorkspaces(req, res));

router.get('/:workspaceId', requireWorkspaceAccess(), (req, res) =>
  workspaceController.getById(req, res)
);

router.post(
  '/:workspaceId/members',
  requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
  validateRequest({ body: AddMemberSchema }),
  (req, res) => workspaceController.addMember(req, res)
);

router.delete(
  '/:workspaceId/members/:userId',
  requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
  (req, res) => workspaceController.removeMember(req, res)
);

export { router as workspaceRouter };
