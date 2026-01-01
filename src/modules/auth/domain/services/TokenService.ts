// src/modules/auth/domain/services/TokenService.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../../../../shared/config/env.config';
import { Result } from '../../../../core/domain/Result';
import { ConfigValidator } from '../../../../shared/config/ConfigValidator';

// Validate token expiration format
if (!ConfigValidator.isValidDuration(config.JWT_EXPIRES_IN)) {
  throw new Error(
    `Invalid JWT_EXPIRES_IN format: "${config.JWT_EXPIRES_IN}". ` +
      'Expected format: number + unit (e.g., "15m", "1h", "7d")'
  );
}

if (!ConfigValidator.isValidDuration(config.JWT_REFRESH_EXPIRES_IN)) {
  throw new Error(
    `Invalid JWT_REFRESH_EXPIRES_IN format: "${config.JWT_REFRESH_EXPIRES_IN}". ` +
      'Expected format: number + unit (e.g., "15m", "1h", "7d")'
  );
}

const ACCESS_TOKEN_OPTIONS: SignOptions = {
  expiresIn:
    (config.JWT_EXPIRES_IN && parseInt(config.JWT_EXPIRES_IN, 10)) ||
    (undefined as number | undefined),
  issuer: 'ddd-core-api',
  audience: 'ddd-core-client',
  algorithm: 'HS256',
};

const REFRESH_TOKEN_OPTIONS: SignOptions = {
  expiresIn:
    (config.JWT_REFRESH_EXPIRES_IN && parseInt(config.JWT_REFRESH_EXPIRES_IN, 10)) ||
    (undefined as number | undefined),
  issuer: 'ddd-core-api',
  audience: 'ddd-core-client',
  algorithm: 'HS256',
};

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  workspaceId?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export class TokenService {
  /**
   * Generate access token with validated expiration
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, ACCESS_TOKEN_OPTIONS);
  }

  /**
   * Generate refresh token with validated expiration
   */
  static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, REFRESH_TOKEN_OPTIONS);
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): Result<TokenPayload> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, {
        issuer: 'ddd-core-api',
        audience: 'ddd-core-client',
        algorithms: ['HS256'],
      }) as TokenPayload;

      return Result.ok(decoded);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return Result.fail('Access token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return Result.fail('Invalid access token');
      }
      return Result.fail('Token verification failed');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): Result<RefreshTokenPayload> {
    try {
      const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, {
        issuer: 'ddd-core-api',
        audience: 'ddd-core-client',
        algorithms: ['HS256'],
      }) as RefreshTokenPayload;

      return Result.ok(decoded);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return Result.fail('Refresh token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return Result.fail('Invalid refresh token');
      }
      return Result.fail('Token verification failed');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Get token expiration time in seconds
   */
  static getTokenExpirationTime(type: 'access' | 'refresh'): number {
    const duration =
      type === 'access' ? config.JWT_EXPIRES_IN : config.JWT_REFRESH_EXPIRES_IN;
    return ConfigValidator.parseDuration(duration);
  }
}
