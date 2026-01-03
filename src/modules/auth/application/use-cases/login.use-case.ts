// src/modules/auth/application/use-cases/login.use-case.ts

import { Session } from '../../domain/entities/session.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { RefreshToken } from '../../domain/value-objects/refresh-token.value-object';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { InvalidCredentialsError, ForbiddenError } from '@core/errors';
import { PasswordUtil, JwtUtil, DateUtil } from '@core/utils';
import { config } from '@core/config';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { LoginRequestDto, LoginResponseDto } from '../dtos';
import { UserMapper } from '../mappers';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository
  ) {}

  async execute(dto: LoginRequestDto): Promise<LoginResponseDto> {
    // Find user by email
    const email = Email.create(dto.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError('Invalid email or password');
    }

    // Verify password
    const passwordValid = await PasswordUtil.compare(dto.password, user.getPasswordHash());

    if (!passwordValid) {
      throw new InvalidCredentialsError('Invalid email or password');
    }

    // Check if user can login
    if (!user.canLogin()) {
      if (user.isDeleted()) {
        throw new ForbiddenError('Account has been deleted');
      }
      if (!user.isEmailVerified()) {
        throw new ForbiddenError('Please verify your email before logging in');
      }
      throw new ForbiddenError('Account is not active');
    }

    // Create refresh token
    const expiresAt = this.parseExpiration(config.JWT_REFRESH_EXPIRES_IN);
    const refreshTokenVO = RefreshToken.create(expiresAt);

    // Create session
    const session = Session.create(user.getId(), refreshTokenVO, dto.ipAddress, dto.userAgent);
    await this.sessionRepository.save(session);

    // Generate JWT tokens
    const accessToken = JwtUtil.generateAccessToken({
      userId: user.getId(),
      email: user.getEmail().getValue(),
    });

    // Update user last login
    user.recordLogin();
    await this.userRepository.update(user);

    // Emit domain event
    const event = new UserLoggedInEvent({
      userId: user.getId(),
      email: user.getEmail().getValue(),
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      loggedInAt: new Date(),
    });

    // Return DTO
    return {
      accessToken,
      refreshToken: refreshTokenVO.getValue(),
      user: UserMapper.toMinimalDto(user),
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
      case 's':
        return new Date(Date.now() + value * 1000);
      default:
        return DateUtil.addDays(new Date(), 7);
    }
  }
}
