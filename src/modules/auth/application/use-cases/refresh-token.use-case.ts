// src/modules/auth/application/use-cases/refresh-token.use-case.ts

import { RefreshToken } from '../../domain/value-objects/refresh-token.value-object';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UnauthorizedError, NotFoundError } from '@core/errors';
import { JwtUtil, DateUtil } from '@core/utils';
import { config } from '@core/config';
import { TokenRefreshedEvent } from '../../domain/events/token-refreshed.event';

export interface RefreshTokenUseCaseInput {
  refreshToken: string;
}

export interface RefreshTokenUseCaseOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: RefreshTokenUseCaseInput): Promise<RefreshTokenUseCaseOutput> {
    // Find session by refresh token
    const session = await this.sessionRepository.findByRefreshToken(
      RefreshToken.fromExisting(input.refreshToken, new Date())
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
