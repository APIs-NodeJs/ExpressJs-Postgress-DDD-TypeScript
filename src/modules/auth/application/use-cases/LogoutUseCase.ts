import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { ITokenBlacklistService } from "../../domain/services/ITokenBlacklistService";
import { ISessionService } from "../../domain/services/ISessionService";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { Logger } from "../../../../shared/infrastructure/logger/logger";

export interface LogoutRequest {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
  logoutAll?: boolean; // Logout from all devices
}

export interface LogoutResponse {
  message: string;
  sessionsTerminated?: number;
}

@injectable()
export class LogoutUseCase implements UseCase<LogoutRequest, LogoutResponse> {
  constructor(
    @inject(TOKENS.ITokenBlacklistService)
    private blacklistService: ITokenBlacklistService,
    @inject(TOKENS.ISessionService) private sessionService: ISessionService
  ) {}

  async execute(req: LogoutRequest): Promise<Result<LogoutResponse>> {
    try {
      // Blacklist access token
      await this.blacklistService.blacklist(
        req.accessToken,
        15 * 60 // 15 minutes (access token expiry)
      );

      // Blacklist refresh token if provided
      if (req.refreshToken) {
        await this.blacklistService.blacklist(
          req.refreshToken,
          7 * 24 * 60 * 60 // 7 days (refresh token expiry)
        );
      }

      let sessionsTerminated = 0;

      if (req.logoutAll) {
        // Logout from all devices
        const sessions = await this.sessionService.getUserSessions(req.userId);
        sessionsTerminated = sessions.length;

        await this.sessionService.deleteUserSessions(req.userId);

        Logger.info("User logged out from all devices", {
          userId: req.userId,
          sessionsTerminated,
        });
      } else if (req.sessionId) {
        // Logout from specific session
        await this.sessionService.deleteSession(req.sessionId);
        sessionsTerminated = 1;

        Logger.info("User logged out from session", {
          userId: req.userId,
          sessionId: req.sessionId,
        });
      }

      return Result.ok({
        message: req.logoutAll
          ? "Logged out from all devices successfully"
          : "Logged out successfully",
        sessionsTerminated:
          sessionsTerminated > 0 ? sessionsTerminated : undefined,
      });
    } catch (error) {
      Logger.error("Logout failed", error, { userId: req.userId });
      return Result.fail("Logout failed");
    }
  }
}
