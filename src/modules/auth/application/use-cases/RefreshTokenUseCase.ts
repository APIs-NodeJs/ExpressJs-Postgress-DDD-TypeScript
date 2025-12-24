import { UseCase } from '../../../../shared/application/UseCase';
import { Result } from '../../../../shared/application/Result';
import { TokenService } from '../../infrastructure/security/TokenService';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export class RefreshTokenUseCase implements UseCase<{ refreshToken: string }, any> {
  constructor(private tokenService: TokenService, private userRepo: UserRepository) {}

  async execute(req: { refreshToken: string }): Promise<Result<any>> {
    try {
      const payload = this.tokenService.verifyRefreshToken(req.refreshToken);
      const user = await this.userRepo.findById(payload.userId);
      if (!user) return Result.fail('User not found');

      const tokens = this.tokenService.generateTokenPair({
        userId: user.id,
        workspaceId: user.workspaceId,
        email: user.email,
      });
      return Result.ok(tokens);
    } catch {
      return Result.fail('Invalid refresh token');
    }
  }
}
