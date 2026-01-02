import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { config } from '@core/config';
import { TokenExpiredError, TokenInvalidError } from '@core/errors';

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export class JwtUtil {
  static generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
    const options: SignOptions = {
      expiresIn: config.JWT_ACCESS_EXPIRES_IN,
    };

    return jwt.sign(
      { ...payload, type: 'access' },
      config.JWT_ACCESS_SECRET,
      options
    );
  }

  static generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
    const options: SignOptions = {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    };

    return jwt.sign(
      { ...payload, type: 'refresh' },
      config.JWT_REFRESH_SECRET,
      options
    );
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      const options: VerifyOptions = {
        algorithms: ['HS256'],
      };

      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET, options) as TokenPayload;

      if (decoded.type !== 'access') {
        throw new TokenInvalidError('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenInvalidError(error.message);
      }
      throw error;
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const options: VerifyOptions = {
        algorithms: ['HS256'],
      };

      const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, options) as TokenPayload;

      if (decoded.type !== 'refresh') {
        throw new TokenInvalidError('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenInvalidError(error.message);
      }
      throw error;
    }
  }

  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}