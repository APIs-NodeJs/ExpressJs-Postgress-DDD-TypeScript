import { Router } from 'express';
import { authRoutes } from '../../../modules/auth/presentation/routes/authRoutes';
import { APP_CONSTANTS } from '../../../config/constants';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

router.use(`${APP_CONSTANTS.API_PREFIX}/auth`, authRoutes);

export { router as routes };
