import { Router, Request, Response } from 'express';
import { ResponseHandler } from '../../shared/responses/ResponseHandler';

export const healthRouter = Router();

healthRouter.get('/', async (req: Request, res: Response) => {
  const requestId = (req as any).id;

  ResponseHandler.ok(
    res,
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
    'Service is healthy',
    requestId
  );
});

healthRouter.get('/readiness', async (req: Request, res: Response) => {
  const requestId = (req as any).id;

  try {
    ResponseHandler.ok(
      res,
      { ready: true },
      'Service is ready',
      requestId
    );
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service not ready',
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
});
