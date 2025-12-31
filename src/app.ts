// src/app.ts
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './shared/config/env.config';
import { errorHandler } from './shared/middlewares/errorHandler';
import { requestLogger } from './shared/middlewares/requestLogger';
import { createRateLimiter } from './shared/middlewares/rateLimiter';
import { addCsrfToken, verifyCsrfToken } from './shared/middlewares/csrfProtection';
import { apiRouter } from './api/v1';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.setupSecurityMiddlewares();
    this.setupParsingMiddlewares();
    this.setupUtilityMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Security middlewares (applied first)
   */
  private setupSecurityMiddlewares(): void {
    // Helmet for secure HTTP headers
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        frameguard: { action: 'deny' },
        noSniff: true,
        referrerPolicy: { policy: 'no-referrer' },
        permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: (origin, callback) => {
          const allowedOrigins = config.ALLOWED_ORIGINS.split(',').map(o => o.trim());

          // Allow requests with no origin (like mobile apps or curl)
          if (!origin) {
            return callback(null, true);
          }

          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        exposedHeaders: ['X-Request-ID'],
      })
    );

    // Rate limiting
    this.app.use(
      createRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        max: 200, // 200 requests per minute
        message: 'Too many requests from this IP, please try again later',
      })
    );

    // Stricter rate limit for auth endpoints
    this.app.use(
      '/api/v1/auth',
      createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // 20 requests per 15 minutes
        message: 'Too many authentication attempts, please try again later',
      })
    );
  }

  /**
   * Request parsing middlewares
   */
  private setupParsingMiddlewares(): void {
    // Cookie parser (needed for CSRF tokens)
    this.app.use(cookieParser());

    // JSON body parser with size limit
    this.app.use(
      express.json({
        limit: '10mb',
        strict: true,
      })
    );

    // URL-encoded body parser
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: '10mb',
      })
    );
  }

  /**
   * Utility middlewares
   */
  private setupUtilityMiddlewares(): void {
    // Response compression
    this.app.use(
      compression({
        level: 6,
        threshold: 1024, // Only compress responses > 1KB
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
      })
    );

    // Request logging
    this.app.use(requestLogger());

    // Add CSRF token to responses (for web clients)
    if (config.NODE_ENV === 'production') {
      this.app.use(addCsrfToken);
    }
  }

  /**
   * Application routes
   */
  private setupRoutes(): void {
    // Health check endpoint (no auth required)
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // CSRF verification for state-changing operations
    if (config.NODE_ENV === 'production') {
      // Apply CSRF protection to all POST, PUT, PATCH, DELETE requests
      this.app.use('/api/v1', (req, res, next) => {
        const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

        if (safeMethods.includes(req.method)) {
          return next();
        }

        // Apply CSRF verification
        return verifyCsrfToken(req, res, next);
      });
    }

    // API routes
    this.app.use('/api/v1', apiRouter);

    // 404 handler for undefined routes
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
          path: req.path,
        },
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Error handling (applied last)
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Graceful shutdown handler
   */
  public async shutdown(): Promise<void> {
    console.log('Starting graceful shutdown...');
    console.log('Graceful shutdown completed');
  }
}
