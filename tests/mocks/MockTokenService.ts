import {
  ITokenService,
  TokenPayload,
  TokenPair,
} from "../../src/modules/auth/domain/services/ITokenService";

export class MockTokenService implements ITokenService {
  private validTokens: Set<string> = new Set();

  generateTokenPair(payload: TokenPayload): TokenPair {
    const accessToken = `access_${payload.userId}`;
    const refreshToken = `refresh_${payload.userId}`;

    this.validTokens.add(accessToken);
    this.validTokens.add(refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    if (!this.validTokens.has(token)) {
      throw new Error("Invalid token");
    }

    const userId = token.replace("access_", "");
    return {
      userId,
      workspaceId: `workspace_${userId}`,
      email: `${userId}@example.com`,
      role: "user",
    };
  }

  verifyRefreshToken(token: string): TokenPayload {
    if (!this.validTokens.has(token)) {
      throw new Error("Invalid token");
    }

    const userId = token.replace("refresh_", "");
    return {
      userId,
      workspaceId: `workspace_${userId}`,
      email: `${userId}@example.com`,
      role: "user",
    };
  }

  // Test helper
  invalidateToken(token: string): void {
    this.validTokens.delete(token);
  }
}
