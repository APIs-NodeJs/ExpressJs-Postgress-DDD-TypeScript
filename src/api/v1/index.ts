// src/api/v1/index.ts
import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from '../../modules/auth/presentation/routes/auth.routes';
import { workspaceRouter } from '../../modules/workspaces/presentation/routes/workspace.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/workspaces', workspaceRouter);
