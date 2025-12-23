import * as jwt from "jsonwebtoken";
import { config } from "@config/env";

export interface JwtPayload {
  userId: string;
  workspaceId: string;
  email: string;
}

export class JwtService {
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.accessTokenSecret, {
      expiresIn: config.jwt.accessTokenExpiry,
    });
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.refreshTokenSecret, {
      expiresIn: config.jwt.refreshTokenExpiry,
    });
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.accessTokenSecret) as JwtPayload;
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.refreshTokenSecret) as JwtPayload;
  }

  static generateTokens(payload: JwtPayload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: 3600, // 1 hour in seconds
    };
  }
}
