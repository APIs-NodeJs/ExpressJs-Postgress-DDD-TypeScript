// src/shared/middlewares/csrfProtection.ts
import { Request, Response, NextFunction } from 'express';
import { randomBytes, createHmac } from 'crypto';
import { config } from '../config/env.config';
import { ResponseHandler } from '../responses/ResponseHandler';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET_LENGTH = 32;

interface CsrfTokenPair {
  token: string;
  secret: string;
}

class CsrfProtection {
  private readonly algorithm = 'sha256';

  /**
   * Generate a CSRF token pair (token + secret)
   */
  public generateTokenPair(): CsrfTokenPair {
    const secret = randomBytes(CSRF_SECRET_LENGTH).toString('hex');
    const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');

    return { token, secret };
  }

  /**
   * Create token hash for verification
   */
  private createHash(token: string, secret: string): string {
    return createHmac(this.algorithm, secret).update(token).digest('hex');
  }

  /**
   * Verify CSRF token
   */
  public verifyToken(token: string, secret: string): boolean {
    if (!token || !secret) {
      return false;
    }

    try {
      const expectedHash = this.createHash(token, secret);
      const actualHash = this.createHash(token, secret);

      // Timing-safe comparison
      return this.timingSafeEqual(expectedHash, actualHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Timing-safe string comparison
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Middleware to add CSRF token to response
   */
  public addToken() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { token, secret } = this.generateTokenPair();

      // Store secret in session/cookie (httpOnly)
      res.cookie('_csrf_secret', secret, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
      });

      // Expose token to client (can be read by JS)
      res.cookie('csrf_token', token, {
        httpOnly: false,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000,
      });

      // Also add to response locals for template rendering
      res.locals.csrfToken = token;

      next();
    };
  }

  /**
   * Middleware to verify CSRF token
   */
  public verifyToken() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Skip verification for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const token = this.extractToken(req);
      const secret = req.cookies?._csrf_secret;

      if (!token || !secret) {
        return ResponseHandler.error(
          res,
          403,
          'CSRF_TOKEN_MISSING',
          'CSRF token is missing',
          undefined,
          req.id
        );
      }

      if (!this.verifyToken(token, secret)) {
        return ResponseHandler.error(
          res,
          403,
          'CSRF_TOKEN_INVALID',
          'Invalid CSRF token',
          undefined,
          req.id
        );
      }

      next();
    };
  }

  /**
   * Extract CSRF token from request
   */
  private extractToken(req: Request): string | null {
    // Try header first (for AJAX requests)
    let token = req.headers['x-csrf-token'] as string;

    if (token) {
      return token;
    }

    // Try body (for form submissions)
    token = req.body?._csrf;

    if (token) {
      return token;
    }

    // Try query (not recommended but supported)
    token = req.query?._csrf as string;

    return token || null;
  }
}

export const csrfProtection = new CsrfProtection();

// Middleware exports
export const addCsrfToken = csrfProtection.addToken();
export const verifyCsrfToken = csrfProtection.verifyToken();
