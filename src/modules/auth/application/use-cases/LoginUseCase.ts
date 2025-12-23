import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { Email } from "@modules/auth/domain/value-objects/Email";
import { PasswordHasher } from "@modules/auth/infrastructure/security/PasswordHasher";
import { JwtService } from "@modules/auth/infrastructure/security/JwtService";
import { LoginRequest } from "../dtos/AuthRequestDtos";
import { AuthResponseDto } from "../dtos/AuthResponseDtos";

import { AccountLockoutService } from '@modules/auth/infrastructure/security/AccountLockout';
import { AuditLogger, AuditEventType } from '@modules/auth/infrastructure/security/AuditLogger';
import { 
  InvalidCredentialsError,
  AuthenticationError 
} from '@shared/domain/errors/DomainErrors';

export class LoginUseCase implements UseCase<LoginRequest, Result<AuthResponseDto>> {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: LoginRequest, context?: { ip?: string; userAgent?: string }): Promise<Result<AuthResponseDto>> {
    // Check if account is locked
    const isLocked = await AccountLockoutService.isAccountLocked(request.email);
    if (isLocked) {
      const remainingTime = await AccountLockoutService.getRemainingLockoutTime(request.email);
      
      AuditLogger.log({
        type: AuditEventType.FAILED_LOGIN_ATTEMPT,
        email: request.email,
        ip: context?.ip,
        userAgent: context?.userAgent,
        metadata: { reason: 'ACCOUNT_LOCKED', remainingTime },
      });

      throw new AuthenticationError(
        `Account is locked. Please try again in ${Math.ceil(remainingTime / 60)} minutes.`
      );
    }

    // Validate email
    const emailOrError = Email.create(request.email);
    if (emailOrError.isFailure) {
      throw new InvalidCredentialsError();
    }

    const email = emailOrError.getValue();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Record failed attempt
      await AccountLockoutService.recordFailedAttempt(request.email);
      
      AuditLogger.logAuthentication(
        AuditEventType.FAILED_LOGIN_ATTEMPT,
        request.email,
        false,
        context?.ip,
        context?.userAgent
      );

      throw new InvalidCredentialsError();
    }

    // Verify password
    const passwordMatch = await PasswordHasher.compare(
      request.password,
      user.password.value
    );

    if (!passwordMatch) {
      // Record failed attempt
      const lockoutResult = await AccountLockoutService.recordFailedAttempt(request.email);
      
      AuditLogger.logAuthentication(
        AuditEventType.FAILED_LOGIN_ATTEMPT,
        request.email,
        false,
        context?.ip,
        context?.userAgent
      );

      if (lockoutResult.locked) {
        throw new AuthenticationError(
          `Too many failed attempts. Account locked for 15 minutes.`
        );
      }

      throw new InvalidCredentialsError();
    }

    // Clear failed attempts on successful login
    await AccountLockoutService.clearFailedAttempts(request.email);

    // Generate tokens
    const tokens = JwtService.generateTokens({
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email.value,
    });

    // Log successful authentication
    AuditLogger.logAuthentication(
      AuditEventType.USER_LOGIN,
      request.email,
      true,
      context?.ip,
      context?.userAgent
    );

    return Result.ok({
      user: {
        id: user.id,
        email: user.email.value,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        workspaceId: user.workspaceId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tokens,
    });
  }
}
