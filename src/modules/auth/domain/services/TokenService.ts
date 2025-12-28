// src/modules/auth/domain/services/TokenService.ts
import * as jwt from 'jsonwebtoken';
import { config } from '../../../../shared/config/env.config';
import { Result } from '../../../../core/domain/Result';

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
  public static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: 'ddd-core-api',
      audience: 'ddd-core-client',
    });
  }

  public static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
      issuer: 'ddd-core-api',
      audience: 'ddd-core-client',
    });
  }

  public static verifyAccessToken(token: string): Result<TokenPayload> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, {
        issuer: 'ddd-core-api',
        audience: 'ddd-core-client',
      }) as TokenPayload;

      return Result.ok<TokenPayload>(decoded);
    } catch (error) {
      return Result.fail<TokenPayload>('Invalid or expired access token');
    }
  }

  public static verifyRefreshToken(token: string): Result<RefreshTokenPayload> {
    try {
      const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, {
        issuer: 'ddd-core-api',
        audience: 'ddd-core-client',
      }) as RefreshTokenPayload;

      return Result.ok<RefreshTokenPayload>(decoded);
    } catch (error) {
      return Result.fail<RefreshTokenPayload>('Invalid or expired refresh token');
    }
  }

  public static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
