import jwt from "jsonwebtoken";
import { config } from "../../../../config/env.config";
import { UnauthorizedError } from "../../../../shared/errors/DomainError";

export interface TokenPayload {
  userId: string;
  email: string;
  workspaceId: string;
  roles?: string[];
}

export interface RefreshTokenPayload {
  userId: string;
  tokenFamily: string; // For refresh token rotation
}

export class TokenService {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRY,
      issuer: "your-app",
      audience: "your-app-users",
    });
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRY,
      issuer: "your-app",
      audience: "your-app-users",
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.JWT_ACCESS_SECRET, {
        issuer: "your-app",
        audience: "your-app-users",
      }) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, config.JWT_REFRESH_SECRET, {
        issuer: "your-app",
        audience: "your-app-users",
      }) as RefreshTokenPayload;
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }
}
