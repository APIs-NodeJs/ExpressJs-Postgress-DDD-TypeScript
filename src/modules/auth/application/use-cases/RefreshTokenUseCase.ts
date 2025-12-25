import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ITokenService } from "../../domain/services/ITokenService";
import { ITokenBlacklistService } from "../../domain/services/ITokenBlacklistService";
import { ISessionService } from "../../domain/services/ISessionService";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { Logger } from "../../../../shared/infrastructure/logger/logger";

export interface RefreshTokenRequest {
  refreshToken: string;
  sessionId?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@injectable()
export class RefreshTokenUseCase implements UseCase<
  RefreshTokenRequest,
  RefreshTokenResponse
> {
  constructor(
    @inject(TOKENS.IUserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.ITokenService) private tokenService: ITokenService,
    @inject(TOKENS.ITokenBlacklistService)
    private blacklistService: ITokenBlacklistService,
    @inject(TOKENS.ISessionService) private sessionService: ISessionService
  ) {}

  async execute(
    req: RefreshTokenRequest
  ): Promise<Result<RefreshTokenResponse>> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.blacklistService.isBlacklisted(
        req.refreshToken
      );

      if (isBlacklisted) {
        Logger.security("Attempted refresh with blacklisted token", {
          token: req.refreshToken.substring(0, 20),
        });
        return Result.fail("Token has been revoked");
      }

      // Verify refresh token
      let payload;
      try {
        payload = this.tokenService.verifyRefreshToken(req.refreshToken);
      } catch (error) {
        Logger.warn("Invalid refresh token", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return Result.fail("Invalid or expired refresh token");
      }

      // Verify user still exists
      const user = await this.userRepo.findById(payload.userId);

      if (!user) {
        Logger.security("Refresh token used for deleted user", {
          userId: payload.userId,
        });
        return Result.fail("User not found");
      }

      // Verify session if provided
      if (req.sessionId) {
        const session = await this.sessionService.getSession(req.sessionId);

        if (!session) {
          Logger.security("Refresh token used with invalid session", {
            userId: user.id,
            sessionId: req.sessionId,
          });
          return Result.fail("Invalid session");
        }

        // Verify session belongs to user
        if (session.userId !== user.id) {
          Logger.security("Session/user mismatch", {
            userId: user.id,
            sessionUserId: session.userId,
            sessionId: req.sessionId,
          });
          return Result.fail("Invalid session");
        }

        // Verify refresh token matches session
        if (session.refreshToken !== req.refreshToken) {
          Logger.security("Refresh token mismatch with session", {
            userId: user.id,
            sessionId: req.sessionId,
          });
          return Result.fail("Invalid token");
        }

        // Update last accessed
        await this.sessionService.updateLastAccessed(req.sessionId);
      }

      // IMPLEMENT REFRESH TOKEN ROTATION
      // 1. Blacklist old refresh token
      await this.blacklistService.blacklist(
        req.refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );

      // 2. Generate new token pair
      const tokens = this.tokenService.generateTokenPair({
        userId: user.id,
        workspaceId: user.workspaceId,
        email: user.email,
        role: user.role,
      });

      // 3. Update session with new refresh token
      if (req.sessionId) {
        const session = await this.sessionService.getSession(req.sessionId);
        if (session) {
          session.refreshToken = tokens.refreshToken;
          // Note: In production, you'd update this in the database
        }
      }

      Logger.info("Token refreshed successfully", {
        userId: user.id,
        sessionId: req.sessionId,
      });

      return Result.ok({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });
    } catch (error) {
      Logger.error("Token refresh failed", error);
      return Result.fail("Failed to refresh token");
    }
  }
}
