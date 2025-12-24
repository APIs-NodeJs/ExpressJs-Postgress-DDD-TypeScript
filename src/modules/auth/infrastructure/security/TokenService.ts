import jwt from "jsonwebtoken";
import { env } from "../../../../config/env";
import {
  ITokenService,
  TokenPayload,
  TokenPair,
} from "../../domain/services/ITokenService";
import { Logger } from "../../../../shared/infrastructure/logger/logger";

export class TokenService implements ITokenService {
  /**
   * Generate access and refresh token pair
   */
  generateTokenPair(payload: TokenPayload): TokenPair {
    try {
      // Validate payload
      if (!payload.userId || !payload.workspaceId || !payload.email) {
        throw new Error("Invalid token payload: missing required fields");
      }

      // Generate access token (short-lived)
      const accessToken = jwt.sign(
        {
          userId: payload.userId,
          workspaceId: payload.workspaceId,
          email: payload.email,
          role: payload.role,
          type: "access", // Token type
        },
        env.JWT_ACCESS_SECRET,
        {
          expiresIn: env.JWT_ACCESS_EXPIRES_IN,
          issuer: "devcycle-api",
          audience: "devcycle-client",
        }
      );

      // Generate refresh token (long-lived)
      const refreshToken = jwt.sign(
        {
          userId: payload.userId,
          workspaceId: payload.workspaceId,
          email: payload.email,
          role: payload.role,
          type: "refresh", // Token type
        },
        env.JWT_REFRESH_SECRET,
        {
          expiresIn: env.JWT_REFRESH_EXPIRES_IN,
          issuer: "devcycle-api",
          audience: "devcycle-client",
        }
      );

      // Calculate expiration time in seconds
      const expiresIn = this.parseExpirationTime(env.JWT_ACCESS_EXPIRES_IN);

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      Logger.error("Failed to generate token pair", error, {
        userId: payload.userId,
      });
      throw new Error("Failed to generate authentication tokens");
    }
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: "devcycle-api",
        audience: "devcycle-client",
      }) as any;

      // Verify token type
      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      return {
        userId: decoded.userId,
        workspaceId: decoded.workspaceId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        Logger.debug("Access token expired");
        throw new Error("Access token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        Logger.warn("Invalid access token", { error: error.message });
        throw new Error("Invalid access token");
      } else {
        Logger.error("Token verification failed", error);
        throw new Error("Failed to verify access token");
      }
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: "devcycle-api",
        audience: "devcycle-client",
      }) as any;

      // Verify token type
      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      return {
        userId: decoded.userId,
        workspaceId: decoded.workspaceId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        Logger.debug("Refresh token expired");
        throw new Error("Refresh token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        Logger.warn("Invalid refresh token", { error: error.message });
        throw new Error("Invalid refresh token");
      } else {
        Logger.error("Token verification failed", error);
        throw new Error("Failed to verify refresh token");
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   * WARNING: Do not use for authentication!
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      Logger.error("Failed to decode token", error);
      return null;
    }
  }

  /**
   * Parse expiration time string to seconds
   * Examples: "15m" -> 900, "7d" -> 604800
   */
  private parseExpirationTime(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    
    if (!match) {
      Logger.warn("Invalid expiration format, using default", { expiration });
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }
}