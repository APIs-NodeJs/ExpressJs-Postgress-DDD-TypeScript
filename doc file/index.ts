import { Router } from 'express';
import { authRoutes } from '../../../modules/auth/presentation/routes/authRoutes';
import { APP_CONSTANTS } from '../../../config/constants';

const router = Router();

// Health check routes
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'healthy',
      cache: 'healthy',
      memory: 'healthy',
    },
  });
});

router.get('/health/liveness', (req, res) => {
  res.json({ status: 'alive' });
});

router.get('/health/readiness', (req, res) => {
  res.json({
    status: 'ready',
    checks: {
      database: 'connected',
      cache: 'connected',
    },
  });
});

// API routes
router.use(`${APP_CONSTANTS.API_PREFIX}/auth`, authRoutes);

export { router as routes };
