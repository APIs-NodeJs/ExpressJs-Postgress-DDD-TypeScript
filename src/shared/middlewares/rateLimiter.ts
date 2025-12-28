import rateLimit from 'express-rate-limit';

export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || 15 * 60 * 1000,
    max: options?.max || 100,
    message: options?.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
  });
};
