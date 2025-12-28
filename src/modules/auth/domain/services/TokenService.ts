// src/modules/auth/domain/services/TokenService.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../../../../shared/config/env.config';
import { Result } from '../../../../core/domain/Result';

function assertStringValue(value: string): number | undefined {
  const numberValue = Number(value);
  if (isNaN(numberValue)) {
    return undefined;
  }
  return numberValue;
}

const ACCESS_TOKEN_OPTIONS: SignOptions = {
  expiresIn: config.JWT_EXPIRES_IN ? assertStringValue(config.JWT_EXPIRES_IN) : undefined,
  issuer: 'ddd-core-api',
  audience: 'ddd-core-client',
};

const REFRESH_TOKEN_OPTIONS: SignOptions = {
  expiresIn: config.JWT_REFRESH_EXPIRES_IN
    ? assertStringValue(config.JWT_REFRESH_EXPIRES_IN)
    : undefined,
  issuer: 'ddd-core-api',
  audience: 'ddd-core-client',
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
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, ACCESS_TOKEN_OPTIONS);
  }

  static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, REFRESH_TOKEN_OPTIONS);
  }

  static verifyAccessToken(token: string): Result<TokenPayload> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, {
        issuer: 'ddd-core-api',
        audience: 'ddd-core-client',
      }) as TokenPayload;

      return Result.ok(decoded);
    } catch {
      return Result.fail('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): Result<RefreshTokenPayload> {
    try {
      const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, {
        issuer: 'ddd-core-api',
        audience: 'ddd-core-client',
      }) as RefreshTokenPayload;

      return Result.ok(decoded);
    } catch {
      return Result.fail('Invalid or expired refresh token');
    }
  }

  static decodeToken(token: string) {
    return jwt.decode(token);
  }
}
