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
import { WorkspaceNotificationService } from '../../application/services/WorkspaceNotificationService';
import { getSocketGateways } from '../../../../shared/infrastructure/socket/setupGateways';

const router = Router();

// Initialize repositories
const unitOfWork = new SequelizeUnitOfWork(sequelize);
const workspaceRepository = new WorkspaceRepository(unitOfWork);
const userRepository = new UserRepository(unitOfWork);

// Initialize use cases
const createWorkspaceUseCase = new CreateWorkspaceUseCase(workspaceRepository);
const addMemberToWorkspaceUseCase = new AddMemberToWorkspaceUseCase(
  workspaceRepository,
  userRepository
);

// Get socket gateways (will be initialized after server starts)
let notificationService: WorkspaceNotificationService;

// Initialize notification service lazily
const getNotificationService = (): WorkspaceNotificationService => {
  if (!notificationService) {
    const gateways = getSocketGateways();
    notificationService = new WorkspaceNotificationService(
      gateways.workspace,
      gateways.notification
    );
  }
  return notificationService;
};

// Initialize controller with lazy notification service
const workspaceController = new WorkspaceController(
  createWorkspaceUseCase,
  addMemberToWorkspaceUseCase,
  workspaceRepository,
  userRepository,
  getNotificationService() // This will be initialized when first accessed
);

// Validation schemas
const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const AddMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum([WorkspaceRole.ADMIN, WorkspaceRole.MEMBER, WorkspaceRole.VIEWER]),
});

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
});

// Apply authentication to all routes
router.use(authenticate);

// Create workspace
router.post('/', validateRequest({ body: CreateWorkspaceSchema }), (req, res) =>
  workspaceController.create(req, res)
);

// Get user's workspaces
router.get('/my-workspaces', (req, res) => workspaceController.getMyWorkspaces(req, res));

// Get workspace by ID
router.get('/:workspaceId', requireWorkspaceAccess(), (req, res) =>
  workspaceController.getById(req, res)
);

// Update workspace
router.patch(
  '/:workspaceId',
  requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
  validateRequest({ body: UpdateWorkspaceSchema }),
  (req, res) => workspaceController.updateWorkspace(req, res)
);

// Add member to workspace
router.post(
  '/:workspaceId/members',
  requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
  validateRequest({ body: AddMemberSchema }),
  (req, res) => workspaceController.addMember(req, res)
);

// Remove member from workspace
router.delete(
  '/:workspaceId/members/:userId',
  requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
  (req, res) => workspaceController.removeMember(req, res)
);

export { router as workspaceRouter };
