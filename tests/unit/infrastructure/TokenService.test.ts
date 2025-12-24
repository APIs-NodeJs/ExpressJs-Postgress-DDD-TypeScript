import { TokenService } from "../../../src/modules/auth/infrastructure/security/TokenService";
import jwt from "jsonwebtoken";
import { env } from "../../../src/config/env";

describe("TokenService", () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
  });

  const mockPayload = {
    userId: "user-123",
    workspaceId: "workspace-123",
    email: "test@example.com",
  };

  describe("generateTokenPair", () => {
    it("should generate access and refresh tokens", () => {
      const tokens = tokenService.generateTokenPair(mockPayload);

      expect(tokens).toHaveProperty("accessToken");
      expect(tokens).toHaveProperty("refreshToken");
      expect(tokens).toHaveProperty("expiresIn");
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.expiresIn).toBe("number");
    });

    it("should generate different tokens", () => {
      const tokens1 = tokenService.generateTokenPair(mockPayload);
      const tokens2 = tokenService.generateTokenPair(mockPayload);

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    it("should include payload in tokens", () => {
      const tokens = tokenService.generateTokenPair(mockPayload);

      const decodedAccess = jwt.decode(tokens.accessToken) as any;
      const decodedRefresh = jwt.decode(tokens.refreshToken) as any;

      expect(decodedAccess.userId).toBe(mockPayload.userId);
      expect(decodedAccess.email).toBe(mockPayload.email);
      expect(decodedRefresh.userId).toBe(mockPayload.userId);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify valid access token", () => {
      const tokens = tokenService.generateTokenPair(mockPayload);
      const payload = tokenService.verifyAccessToken(tokens.accessToken);

      expect(payload.userId).toBe(mockPayload.userId);
      expect(payload.email).toBe(mockPayload.email);
      expect(payload.workspaceId).toBe(mockPayload.workspaceId);
    });

    it("should throw on invalid token", () => {
      expect(() => {
        tokenService.verifyAccessToken("invalid-token");
      }).toThrow();
    });

    it("should throw on expired token", () => {
      const expiredToken = jwt.sign(mockPayload, env.JWT_ACCESS_SECRET, {
        expiresIn: "0s",
      });

      expect(() => {
        tokenService.verifyAccessToken(expiredToken);
      }).toThrow();
    });

    it("should throw on token signed with wrong secret", () => {
      const wrongToken = jwt.sign(mockPayload, "wrong-secret");

      expect(() => {
        tokenService.verifyAccessToken(wrongToken);
      }).toThrow();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify valid refresh token", () => {
      const tokens = tokenService.generateTokenPair(mockPayload);
      const payload = tokenService.verifyRefreshToken(tokens.refreshToken);

      expect(payload.userId).toBe(mockPayload.userId);
      expect(payload.email).toBe(mockPayload.email);
    });

    it("should throw on invalid refresh token", () => {
      expect(() => {
        tokenService.verifyRefreshToken("invalid-token");
      }).toThrow();
    });

    it("should not verify access token as refresh token", () => {
      const tokens = tokenService.generateTokenPair(mockPayload);

      expect(() => {
        tokenService.verifyRefreshToken(tokens.accessToken);
      }).toThrow();
    });
  });
});
