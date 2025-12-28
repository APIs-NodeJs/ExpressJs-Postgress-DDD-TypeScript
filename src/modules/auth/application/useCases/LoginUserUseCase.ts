// src/modules/auth/application/useCases/LoginUserUseCase.ts
import { IUseCase } from '../../../../core/application/UseCase';
import { Result } from '../../../../core/domain/Result';
import { Email } from '../../../users/domain/valueObjects/Email';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { PasswordService } from '../../domain/services/PasswordService';
import { TokenService, TokenPayload } from '../../domain/services/TokenService';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';

interface LoginUserRequest {
  email: string;
  password: string;
}

interface LoginUserResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class LoginUserUseCase implements IUseCase<LoginUserRequest, LoginUserResponse> {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async execute(request: LoginUserRequest): Promise<Result<LoginUserResponse>> {
    const emailResult = Email.create(request.email);
    if (emailResult.isFailure) {
      return Result.fail<LoginUserResponse>('Invalid email or password');
    }

    const user = await this.userRepository.findByEmail(emailResult.getValue());
    if (!user) {
      return Result.fail<LoginUserResponse>('Invalid email or password');
    }

    if (!user.passwordHash) {
      return Result.fail<LoginUserResponse>('Please login with Google');
    }

    const isPasswordValid = await PasswordService.compare(
      request.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      return Result.fail<LoginUserResponse>('Invalid email or password');
    }

    if (!user.canAuthenticate()) {
      return Result.fail<LoginUserResponse>('Account is inactive or email not verified');
    }

    user.updateLastLogin();
    await this.userRepository.save(user);

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email.value,
      role: user.role,
    };

    const accessToken = TokenService.generateAccessToken(tokenPayload);
    const refreshTokenValue = TokenService.generateRefreshToken({
      userId: user.id,
      tokenVersion: 1,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenResult = RefreshToken.create({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt,
    });

    if (refreshTokenResult.isSuccess) {
      await this.refreshTokenRepository.save(refreshTokenResult.getValue());
    }

    return Result.ok<LoginUserResponse>({
      user: {
        id: user.id,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken: refreshTokenValue,
    });
  }
}
