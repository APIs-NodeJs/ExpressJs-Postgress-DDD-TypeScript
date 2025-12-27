import { CommandHandler } from "../../../../../core/application/Command";
import { Result } from "../../../../../core/domain/Result";
import { LoginCommand } from "../LoginCommand";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { Email } from "../../../domain/value-objects/Email.vo";
import { BcryptHasher } from "../../../infrastructure/security/BcryptHasher";
import { JwtTokenService } from "../../../infrastructure/security/JwtTokenService";
import { EventPublisher } from "../../../../../core/infrastructure/messaging/EventPublisher";
import { UserStatus } from "../../../domain/aggregates/User.aggregate";
import { cacheService } from "../../../../../shared/infrastructure/cache/CacheService";
import { logger } from "../../../../../shared/utils/logger";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  expiresIn: number;
}

export class LoginHandler implements CommandHandler<
  LoginCommand,
  LoginResponse
> {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hasher: BcryptHasher,
    private readonly tokenService: JwtTokenService,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(command: LoginCommand): Promise<Result<LoginResponse>> {
    const startTime = Date.now();

    try {
      // Step 1: Validate email format
      const emailOrError = Email.create(command.email);
      if (emailOrError.isFailure) {
        logger.warn("Login attempt with invalid email format", {
          email: command.email,
          ipAddress: command.ipAddress,
        });
        return Result.fail<LoginResponse>("Invalid credentials");
      }
      const email = emailOrError.getValue();

      // Step 2: Check rate limiting (before DB query)
      const isRateLimited = await this.checkRateLimit(email.value);
      if (isRateLimited) {
        logger.warn("Login rate limit exceeded", {
          email: email.value,
          ipAddress: command.ipAddress,
        });
        return Result.fail<LoginResponse>(
          "Too many login attempts. Please try again later"
        );
      }

      // Step 3: Find user
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // Record failed attempt even for non-existent users
        await this.recordFailedAttempt(email.value);

        logger.warn("Login attempt for non-existent user", {
          email: email.value,
          ipAddress: command.ipAddress,
        });

        // Use same error message to prevent user enumeration
        return Result.fail<LoginResponse>("Invalid credentials");
      }

      // Step 4: Check user status
      if (user.status === UserStatus.DELETED) {
        logger.warn("Login attempt for deleted user", {
          userId: user.id,
          email: email.value,
          ipAddress: command.ipAddress,
        });
        return Result.fail<LoginResponse>("Account not found");
      }

      if (user.status === UserStatus.SUSPENDED) {
        logger.warn("Login attempt for suspended user", {
          userId: user.id,
          email: email.value,
          ipAddress: command.ipAddress,
        });
        return Result.fail<LoginResponse>(
          "Account is suspended. Please contact support"
        );
      }

      // Step 5: Verify password
      const isPasswordValid = await this.hasher.compare(
        command.password,
        user.password.value
      );

      if (!isPasswordValid) {
        // Record failed attempt
        await this.recordFailedAttempt(email.value);

        logger.warn("Login attempt with invalid password", {
          userId: user.id,
          email: email.value,
          ipAddress: command.ipAddress,
        });

        return Result.fail<LoginResponse>("Invalid credentials");
      }

      // Step 6: Check if user has workspace
      if (!user.hasWorkspace) {
        logger.error("User login failed - no workspace assigned", {
          userId: user.id,
          email: email.value,
          ipAddress: command.ipAddress,
        });
        return Result.fail<LoginResponse>(
          "Account setup incomplete. Please contact support."
        );
      }

      // Step 7: Clear failed attempts on successful login
      await this.clearFailedAttempts(email.value);

      // Step 8: Generate tokens with enhanced payload
      const tokenPayload = {
        userId: user.id,
        email: user.email.value,
        workspaceId: user.workspaceId!, // Non-null assertion - we checked hasWorkspace above
      };

      const { accessToken, refreshToken } =
        this.tokenService.generateTokenPair(tokenPayload);

      // Step 9: Get token expiration for response
      const expiresIn =
        this.tokenService.getTimeUntilExpiration(accessToken) || 900000;

      // Step 10: Record login event
      user.recordLogin(command.ipAddress);

      // Step 11: Publish events
      await this.eventPublisher.publishAll(user.domainEvents);
      user.clearEvents();

      // Step 12: Update last login cache
      await this.updateLastLogin(user.id);

      const duration = Date.now() - startTime;

      logger.info("User logged in successfully", {
        userId: user.id,
        email: user.email.value,
        ipAddress: command.ipAddress,
        duration: `${duration}ms`,
      });

      return Result.ok({
        accessToken,
        refreshToken,
        userId: user.id,
        email: user.email.value,
        expiresIn,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Login failed with error", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: command.email,
        ipAddress: command.ipAddress,
        duration: `${duration}ms`,
      });

      return Result.fail<LoginResponse>("Login failed. Please try again later");
    }
  }

  // Rate limiting implementation
  private async checkRateLimit(email: string): Promise<boolean> {
    const key = `login:attempts:${email}`;
    const lockoutKey = `login:lockout:${email}`;

    // Check if account is locked out
    const isLockedOut = await cacheService.exists(lockoutKey);
    if (isLockedOut) {
      return true;
    }

    // Get current attempt count
    const attempts = await cacheService.get<number>(key);
    if (attempts && attempts >= this.MAX_LOGIN_ATTEMPTS) {
      // Lock out the account
      await cacheService.setWithExpiry(
        lockoutKey,
        true,
        Math.floor(this.LOCKOUT_DURATION / 1000)
      );
      return true;
    }

    return false;
  }

  private async recordFailedAttempt(email: string): Promise<void> {
    const key = `login:attempts:${email}`;

    try {
      const currentAttempts = (await cacheService.get<number>(key)) || 0;
      const newAttempts = currentAttempts + 1;

      await cacheService.setWithExpiry(
        key,
        newAttempts,
        Math.floor(this.ATTEMPT_WINDOW / 1000)
      );

      logger.debug("Failed login attempt recorded", {
        email,
        attempts: newAttempts,
        maxAttempts: this.MAX_LOGIN_ATTEMPTS,
      });
    } catch (error) {
      logger.error("Failed to record login attempt", {
        email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async clearFailedAttempts(email: string): Promise<void> {
    const key = `login:attempts:${email}`;
    const lockoutKey = `login:lockout:${email}`;

    try {
      await cacheService.del(key);
      await cacheService.del(lockoutKey);

      logger.debug("Failed login attempts cleared", { email });
    } catch (error) {
      logger.error("Failed to clear login attempts", {
        email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    const key = `user:last_login:${userId}`;

    try {
      await cacheService.setWithExpiry(
        key,
        new Date().toISOString(),
        60 * 60 * 24 // 24 hours
      );
    } catch (error) {
      logger.error("Failed to update last login cache", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Helper method to get failed attempt count (useful for admin/monitoring)
  async getFailedAttemptCount(email: string): Promise<number> {
    const key = `login:attempts:${email}`;
    return (await cacheService.get<number>(key)) || 0;
  }

  // Helper method to check if account is locked out
  async isAccountLockedOut(email: string): Promise<boolean> {
    const lockoutKey = `login:lockout:${email}`;
    return await cacheService.exists(lockoutKey);
  }

  // Helper method to manually unlock account (admin function)
  async unlockAccount(email: string): Promise<void> {
    await this.clearFailedAttempts(email);
    logger.info("Account manually unlocked", { email });
  }
}
