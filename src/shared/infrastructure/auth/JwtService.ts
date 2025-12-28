import jwt from 'jsonwebtoken';
import { config } from '@/shared/config/env.config';

export interface TokenPayload {
  id: string;
  email: string;
  roles: string[];
}

export class JwtService {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ id: userId }, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  }

  verifyRefreshToken(token: string): { id: string } {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as { id: string };
  }
}

export const jwtService = new JwtService();
