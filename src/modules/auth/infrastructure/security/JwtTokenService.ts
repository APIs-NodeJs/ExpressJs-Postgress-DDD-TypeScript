import * as jwt from "jsonwebtoken";
import { logger } from "../../../../shared/utils/logger";

interface TokenPayload {
  userId: string;
  email?: string;
  workspaceId?: string;
  roles?: string[];
}

interface RefreshTokenPayload {
  userId: string;
  tokenVersion?: number; // For token rotation/revocation
}

export class JwtTokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly issuer: string = "your-app";
  private readonly audience: string = "your-app-users";
  private readonly accessTokenExpiry: number = 60 * 15; // 15 minutes
  private readonly refreshTokenExpiry: number = 60 * 60 * 24 * 7; // 7 days

  constructor(
    accessSecret: string,
    refreshSecret: string,
    accessExpiry: number = 60 * 15,
    refreshExpiry: number = 60 * 60 * 24 * 7
  ) {
    // Validate secrets
    if (!accessSecret || accessSecret.length < 32) {
      throw new Error("Access token secret must be at least 32 characters");
    }
    if (!refreshSecret || refreshSecret.length < 32) {
      throw new Error("Refresh token secret must be at least 32 characters");
    }
    if (accessSecret === refreshSecret) {
      throw new Error("Access and refresh secrets must be different");
    }

    this.accessTokenSecret = accessSecret;
    this.refreshTokenSecret = refreshSecret;
    this.accessTokenExpiry = accessExpiry;
    this.refreshTokenExpiry = refreshExpiry;
  }

  generateAccessToken(payload: TokenPayload): string {
    try {
      // Validate required fields
      if (!payload.userId) {
        throw new Error("userId is required in token payload");
      }

      // Add security metadata
      const tokenPayload = {
        ...payload,
        type: "access",
        iat: Math.floor(Date.now() / 1000),
      };

      const token = jwt.sign(tokenPayload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        subject: payload.userId,
        algorithm: "HS256",
      });

      logger.debug("Access token generated", {
        userId: payload.userId,
        expiresIn: this.accessTokenExpiry,
      });

      return token;
    } catch (error) {
      logger.error("Failed to generate access token", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: payload.userId,
      });
      throw new Error("Token generation failed");
    }
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    try {
      // Validate required fields
      if (!payload.userId) {
        throw new Error("userId is required in token payload");
      }

      // Add security metadata
      const tokenPayload = {
        ...payload,
        type: "refresh",
        iat: Math.floor(Date.now() / 1000),
      };

      const token = jwt.sign(tokenPayload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        subject: payload.userId,
        algorithm: "HS256",
      });

      logger.debug("Refresh token generated", {
        userId: payload.userId,
        expiresIn: this.refreshTokenExpiry,
      });

      return token;
    } catch (error) {
      logger.error("Failed to generate refresh token", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: payload.userId,
      });
      throw new Error("Token generation failed");
    }
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ["HS256"],
      }) as TokenPayload & { type?: string };

      // Validate token type
      if (decoded.type !== "access") {
        logger.warn("Invalid token type for access token", {
          type: decoded.type,
        });
        return null;
      }

      // Validate required fields
      if (!decoded.userId) {
        logger.warn("Access token missing userId");
        return null;
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        workspaceId: decoded.workspaceId,
        roles: decoded.roles,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug("Access token expired", {
          expiredAt: error.expiredAt,
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn("Invalid access token", {
          error: error.message,
        });
      } else {
        logger.error("Access token verification error", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      return null;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ["HS256"],
      }) as RefreshTokenPayload & { type?: string };

      // Validate token type
      if (decoded.type !== "refresh") {
        logger.warn("Invalid token type for refresh token", {
          type: decoded.type,
        });
        return null;
      }

      // Validate required fields
      if (!decoded.userId) {
        logger.warn("Refresh token missing userId");
        return null;
      }

      return {
        userId: decoded.userId,
        tokenVersion: decoded.tokenVersion,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug("Refresh token expired", {
          expiredAt: error.expiredAt,
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn("Invalid refresh token", {
          error: error.message,
        });
      } else {
        logger.error("Refresh token verification error", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      return null;
    }
  }

  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error("Token decode error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  // NEW: Get token expiration time
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as { exp?: number };
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error("Failed to get token expiration", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  // NEW: Check if token is expired
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    return expiration < new Date();
  }

  // NEW: Get time until token expires
  getTimeUntilExpiration(token: string): number | null {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return null;
    }
    return Math.max(0, expiration.getTime() - Date.now());
  }

  // NEW: Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  } | null> {
    try {
      // Verify refresh token
      const payload = this.verifyRefreshToken(refreshToken);
      if (!payload) {
        logger.warn("Invalid refresh token for access token refresh");
        return null;
      }

      // Here you would typically:
      // 1. Check if refresh token is revoked in database
      // 2. Get latest user data from database
      // 3. Implement token rotation (optional)

      // For now, we'll generate new tokens with the same userId
      const newAccessToken = this.generateAccessToken({
        userId: payload.userId,
      });

      // Optional: Implement refresh token rotation
      // Generate new refresh token with incremented version
      const newRefreshToken = this.generateRefreshToken({
        userId: payload.userId,
        tokenVersion: (payload.tokenVersion || 0) + 1,
      });

      logger.info("Tokens refreshed", {
        userId: payload.userId,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error("Failed to refresh tokens", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  // NEW: Generate token pair (access + refresh)
  generateTokenPair(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({
      userId: payload.userId,
      tokenVersion: 1,
    });

    return { accessToken, refreshToken };
  }

  // NEW: Validate token format without verification
  isValidTokenFormat(token: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return false;
      }

      // Try to decode without verification
      jwt.decode(token);
      return true;
    } catch (error) {
      return false;
    }
  }
}
