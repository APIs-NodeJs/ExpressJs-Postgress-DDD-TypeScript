// src/modules/auth/application/useCases/GoogleAuthUseCase.ts
import { IUseCase } from '../../../../core/application/UseCase';
import { Result } from '../../../../core/domain/Result';
import { User } from '../../../users/domain/entities/User';
import { Email } from '../../../users/domain/valueObjects/Email';
import { UserRole } from '../../../users/domain/valueObjects/UserRole';
import { IUserRepository } from '../../../users/domain/repositories/IUserRepository';
import { TokenService, TokenPayload } from '../../domain/services/TokenService';
import { GoogleOAuthProvider } from '../../infrastructure/GoogleOAuthProvider';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';

interface GoogleAuthRequest {
  code: string;
}

interface GoogleAuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export class GoogleAuthUseCase implements IUseCase<
  GoogleAuthRequest,
  GoogleAuthResponse
> {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async execute(request: GoogleAuthRequest): Promise<Result<GoogleAuthResponse>> {
    const tokensResult = await GoogleOAuthProvider.exchangeCodeForTokens(request.code);
    if (tokensResult.isFailure) {
      return Result.fail<GoogleAuthResponse>(tokensResult.getErrorValue());
    }

    const tokens = tokensResult.getValue();
    const userInfoResult = await GoogleOAuthProvider.getUserInfo(tokens.access_token);
    if (userInfoResult.isFailure) {
      return Result.fail<GoogleAuthResponse>(userInfoResult.getErrorValue());
    }

    const googleUser = userInfoResult.getValue();

    const emailResult = Email.create(googleUser.email);
    if (emailResult.isFailure) {
      return Result.fail<GoogleAuthResponse>(emailResult.getErrorValue());
    }

    let user = await this.userRepository.findByEmail(emailResult.getValue());
    let isNewUser = false;

    if (!user) {
      const userResult = User.create({
        email: emailResult.getValue(),
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        googleId: googleUser.id,
        role: UserRole.USER,
        emailVerified: googleUser.verified_email,
      });

      if (userResult.isFailure) {
        return Result.fail<GoogleAuthResponse>(userResult.getErrorValue());
      }

      user = userResult.getValue();
      await this.userRepository.save(user);
      isNewUser = true;
    } else {
      user.updateLastLogin();
      await this.userRepository.save(user);
    }

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

    return Result.ok<GoogleAuthResponse>({
      user: {
        id: user.id,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken: refreshTokenValue,
      isNewUser,
    });
  }
}
