import { UseCase } from '../../../../shared/application/UseCase';
import { Result } from '../../../../shared/application/Result';
import { TokenService, TokenPair } from '../../infrastructure/security/TokenService';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export interface RefreshTokenRequest {
  refreshToken: string;
}

export type RefreshTokenResponse = TokenPair;

export class RefreshTokenUseCase implements UseCase<RefreshTokenRequest, RefreshTokenResponse> {
  constructor(
    private tokenService: TokenService,
    private userRepository: UserRepository
  ) {}

  async execute(request: RefreshTokenRequest): Promise<Result<RefreshTokenResponse>> {
    try {
      // Verify refresh token
      const payload = this.tokenService.verifyRefreshToken(request.refreshToken);

      // Verify user still exists
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        return Result.fail('User not found');
      }

      // Generate new token pair
      const tokens = this.tokenService.generateTokenPair({
        userId: user.id,
        workspaceId: user.workspaceId,
        email: user.email,
      });

      return Result.ok(tokens);
    } catch (error) {
      return Result.fail('Invalid refresh token');
    }
  }
}
