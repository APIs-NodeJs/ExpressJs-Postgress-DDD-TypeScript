// src/modules/auth/application/use-cases/get-current-user.use-case.ts

import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { NotFoundError, UnauthorizedError } from '@core/errors';
import { GetCurrentUserRequestDto } from '../dtos/request';
import { UserResponseDto } from '../dtos/response';
import { UserMapper } from '../mappers';

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: GetCurrentUserRequestDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(dto.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isDeleted()) {
      throw new UnauthorizedError('User account has been deleted');
    }

    return UserMapper.toDto(user);
  }
}

// src/modules/auth/application/use-cases/refresh-token.use-case.ts

import { RefreshToken } from '../../domain/value-objects/refresh-token.value-object';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UnauthorizedError, NotFoundError } from '@core/errors';
import { JwtUtil, DateUtil } from '@core/utils';
import { config } from '@core/config';
import { TokenRefreshedEvent } from '../../domain/events/token-refreshed.event';
import { RefreshTokenRequestDto, RefreshTokenResponseDto } from '../dtos';

export class RefreshTokenUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    // Find session by refresh token
    const session = await this.sessionRepository.findByRefreshToken(
      RefreshToken.fromExisting(dto.refreshToken, new Date())
    );

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Validate session
    if (!session.isValid()) {
      if (session.getIsRevoked()) {
        throw new UnauthorizedError('Session has been revoked');
      }
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Get user
    const user = await this.userRepository.findById(session.getUserId());
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.canLogin()) {
      await this.sessionRepository.delete(session.getId());
      throw new UnauthorizedError('User account is not active');
    }

    // Rotate refresh token
    const expiresAt = this.parseExpiration(config.JWT_REFRESH_EXPIRES_IN);
    const newRefreshToken = RefreshToken.create(expiresAt);
    session.rotate(newRefreshToken);
    await this.sessionRepository.update(session);

    // Generate new access token
    const accessToken = JwtUtil.generateAccessToken({
      userId: user.getId(),
      email: user.getEmail().getValue(),
    });

    // Emit domain event
    const event = new TokenRefreshedEvent({
      userId: user.getId(),
      sessionId: session.getId(),
      refreshedAt: new Date(),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken.getValue(),
    };
  }

  private parseExpiration(expiration: string): Date {
    const match = expiration.match(/^(\d+)([dhms])$/);
    if (!match) {
      return DateUtil.addDays(new Date(), 7);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return DateUtil.addDays(new Date(), value);
      case 'h':
        return DateUtil.addHours(new Date(), value);
      case 'm':
        return DateUtil.addMinutes(new Date(), value);
      default:
        return DateUtil.addDays(new Date(), 7);
    }
  }
}

// src/modules/auth/application/use-cases/logout.use-case.ts

import { RefreshToken } from '../../domain/value-objects/refresh-token.value-object';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { NotFoundError } from '@core/errors';
import { UserLoggedOutEvent } from '../../domain/events/user-logged-out.event';
import { LogoutRequestDto } from '../dtos/request';

export class LogoutUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(dto: LogoutRequestDto): Promise<void> {
    // Find session
    const session = await this.sessionRepository.findByRefreshToken(
      RefreshToken.fromExisting(dto.refreshToken, new Date())
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Revoke session
    session.revoke();
    await this.sessionRepository.update(session);

    // Emit domain event
    const event = new UserLoggedOutEvent({
      userId: session.getUserId(),
      sessionId: session.getId(),
      loggedOutAt: new Date(),
    });
  }
}
