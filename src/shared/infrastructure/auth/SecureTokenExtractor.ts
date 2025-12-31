// src/shared/infrastructure/auth/SecureTokenExtractor.ts
import { Request } from 'express';
import { Result } from '../../../core/domain/Result';
import { Logger } from '../../../core/utils/Logger';

type TokenSource = 'header' | 'cookie';

interface TokenExtractionStrategy {
  source: TokenSource;
  priority: number;
}

export class SecureTokenExtractor {
  private readonly logger: Logger;
  private readonly strategies: TokenExtractionStrategy[] = [
    { source: 'header', priority: 1 }, // Preferred
    { source: 'cookie', priority: 2 }, // Fallback for web
    // Query params are explicitly excluded for security reasons
  ];

  constructor() {
    this.logger = new Logger('SecureTokenExtractor');
  }

  public extract(req: Request): Result<string> {
    for (const strategy of this.strategies) {
      const token = this.extractFromSource(req, strategy.source);

      if (token) {
        this.logger.debug('Token extracted', {
          source: strategy.source,
          hasToken: !!token,
        });
        return Result.ok(token);
      }
    }

    this.logger.warn('No valid token found', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent'],
    });

    return Result.fail('AUTHENTICATION_REQUIRED');
  }

  private extractFromSource(req: Request, source: TokenSource): string | null {
    switch (source) {
      case 'header':
        return this.extractFromHeader(req);
      case 'cookie':
        return this.extractFromCookie(req);
      default:
        return null;
    }
  }

  private extractFromHeader(req: Request): string | null {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return null;
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.warn('Invalid authorization header format', {
        ip: req.ip,
      });
      return null;
    }

    const token = authHeader.substring(7);

    if (!token || token.length === 0) {
      return null;
    }

    return token;
  }

  private extractFromCookie(req: Request): string | null {
    // Access token from cookie if present
    const token = req.cookies?.accessToken;

    if (!token || token.length === 0) {
      return null;
    }

    return token;
  }

  public extractRefreshToken(req: Request): Result<string> {
    // Refresh tokens should only come from secure cookies
    const token = req.cookies?.refreshToken;

    if (!token) {
      this.logger.warn('No refresh token found in cookies', {
        ip: req.ip,
      });
      return Result.fail('REFRESH_TOKEN_REQUIRED');
    }

    this.logger.debug('Refresh token extracted from cookie');
    return Result.ok(token);
  }
}

export const secureTokenExtractor = new SecureTokenExtractor();
