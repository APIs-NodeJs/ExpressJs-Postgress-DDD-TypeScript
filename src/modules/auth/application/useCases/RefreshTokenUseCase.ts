// src/modules/auth/application/useCases/RefreshTokenUseCase.ts
import { IUseCase } from '../../../../core/application/UseCase';
import { Result } from '../../../../core/domain/Result';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { TokenService, TokenPayload } from '../../domain/services/TokenService';
import { RefreshToken } from '../../domain/entities/RefreshToken';

interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase implements IUseCase<
  RefreshTokenRequest,
  RefreshTokenResponse
> {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async execute(request: RefreshTokenRequest): Promise<Result<RefreshTokenResponse>> {
    const verifyResult = TokenService.verifyRefreshToken(request.refreshToken);
    if (verifyResult.isFailure) {
      return Result.fail<RefreshTokenResponse>(verifyResult.getErrorValue());
    }

    const payload = verifyResult.getValue();

    const storedToken = await this.refreshTokenRepository.findByToken(
      request.refreshToken
    );
    if (!storedToken || !storedToken.isValid()) {
      return Result.fail<RefreshTokenResponse>('Invalid refresh token');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.canAuthenticate()) {
      return Result.fail<RefreshTokenResponse>('User not found or inactive');
    }

    storedToken.revoke();
    await this.refreshTokenRepository.save(storedToken);

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email.value,
      role: user.role,
    };

    const accessToken = TokenService.generateAccessToken(tokenPayload);
    const newRefreshTokenValue = TokenService.generateRefreshToken({
      userId: user.id,
      tokenVersion: payload.tokenVersion + 1,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newRefreshTokenResult = RefreshToken.create({
      userId: user.id,
      token: newRefreshTokenValue,
      expiresAt,
    });

    if (newRefreshTokenResult.isSuccess) {
      await this.refreshTokenRepository.save(newRefreshTokenResult.getValue());
    }

    return Result.ok<RefreshTokenResponse>({
      accessToken,
      refreshToken: newRefreshTokenValue,
    });
  }
}
