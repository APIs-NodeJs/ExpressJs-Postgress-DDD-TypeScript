import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { ITokenService } from "../../domain/services/ITokenService";
import { IAccountLockoutService } from "../../domain/services/IAccountLockoutService";
import { ISessionService } from "../../domain/services/ISessionService";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { Logger } from "../../../../shared/infrastructure/logger/logger";

export interface LoginRequest {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    workspaceId: string;
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  session: {
    sessionId: string;
  };
}

@injectable()
export class LoginUseCase implements UseCase<LoginRequest, LoginResponse> {
  constructor(
    @inject(TOKENS.IUserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.IPasswordHasher) private passwordHasher: IPasswordHasher,
    @inject(TOKENS.ITokenService) private tokenService: ITokenService,
    @inject(TOKENS.IAccountLockoutService)
    private lockoutService: IAccountLockoutService,
    @inject(TOKENS.ISessionService) private sessionService: ISessionService
  ) {}

  async execute(req: LoginRequest): Promise<Result<LoginResponse>> {
    try {
      // Normalize email
      const normalizedEmail = req.email.toLowerCase().trim();

      // Find user
      const user = await this.userRepo.findByEmail(normalizedEmail);

      if (!user) {
        Logger.security("Login attempt with non-existent email", {
          email: normalizedEmail,
          ipAddress: req.ipAddress,
        });

        // Return generic error to prevent email enumeration
        return Result.fail("Invalid credentials");
      }

      // Check if account is locked
      const isLocked = await this.lockoutService.isLocked(user.id);

      if (isLocked) {
        const remainingTime = await this.lockoutService.getRemainingLockTime(
          user.id
        );
        const minutes = Math.ceil(remainingTime / 60000);

        Logger.security("Login attempt on locked account", {
          userId: user.id,
          email: user.email,
          ipAddress: req.ipAddress,
          remainingMinutes: minutes,
        });

        return Result.fail(
          `Account is temporarily locked. Please try again in ${minutes} minute(s).`
        );
      }

      // Verify password
      const isValidPassword = await this.passwordHasher.compare(
        req.password,
        user.password
      );

      if (!isValidPassword) {
        // Record failed attempt
        await this.lockoutService.recordFailedAttempt(user.id);

        const attempts = this.lockoutService.getAttempts(user.id);

        Logger.security("Failed login attempt", {
          userId: user.id,
          email: user.email,
          attempts,
          ipAddress: req.ipAddress,
        });

        return Result.fail("Invalid credentials");
      }

      // Check if email is verified (optional enforcement)
      const userWithVerification = user as any;
      if (
        userWithVerification.emailVerified !== undefined &&
        !userWithVerification.emailVerified
      ) {
        Logger.warn("Login attempt with unverified email", {
          userId: user.id,
          email: user.email,
        });

        // You can either:
        // 1. Block login: return Result.fail("Please verify your email first");
        // 2. Allow login with warning (current implementation)
      }

      // Reset failed attempts on successful login
      await this.lockoutService.resetAttempts(user.id);

      // Generate tokens
      const tokens = this.tokenService.generateTokenPair({
        userId: user.id,
        workspaceId: user.workspaceId,
        email: user.email,
        role: user.role,
      });

      // Create session
      const session = await this.sessionService.createSession(
        user.id,
        tokens.refreshToken,
        {
          ipAddress: req.ipAddress,
          userAgent: req.userAgent,
        }
      );

      Logger.info("User logged in successfully", {
        userId: user.id,
        email: user.email,
        sessionId: session.sessionId,
        ipAddress: req.ipAddress,
      });

      return Result.ok({
        user: {
          ...user.toDTO(),
          emailVerified: userWithVerification.emailVerified ?? false,
        },
        tokens,
        session: {
          sessionId: session.sessionId,
        },
      });
    } catch (error) {
      Logger.error("Login failed", error, {
        email: req.email,
        ipAddress: req.ipAddress,
      });

      return Result.fail("Login failed. Please try again.");
    }
  }
}
