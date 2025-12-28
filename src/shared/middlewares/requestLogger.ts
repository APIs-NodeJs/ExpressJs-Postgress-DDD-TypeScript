import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey'];

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in sanitized) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }

  return sanitized;
}

export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    (req as any).id = uuidv4();
    const startTime = Date.now();

    console.log('→ Request:', {
      requestId: (req as any).id,
      method: req.method,
      path: req.path,
      query: sanitize(req.query),
      ip: req.ip,
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log('← Response:', {
        requestId: (req as any).id,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  };
}
