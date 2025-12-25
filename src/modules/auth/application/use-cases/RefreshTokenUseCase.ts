import { Result } from "../../../../shared/application/Result";

export class RefreshTokenUseCase {
  tokenService: any;
  tokenBlacklistService: any;
  userRepo: any;
  async execute(req: { refreshToken: string }): Promise<Result<any>> {
    const payload = this.tokenService.verifyRefreshToken(req.refreshToken);

    // ⚠️ MISSING: Check if token is blacklisted
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(
      req.refreshToken
    );
    if (isBlacklisted) {
      return Result.fail("Token has been revoked");
    }

    // ⚠️ MISSING: Implement refresh token rotation
    // Invalidate old refresh token and issue new pair
    await this.tokenBlacklistService.blacklist(req.refreshToken);

    const user = await this.userRepo.findById(payload.userId);
    if (!user) return Result.fail("User not found");

    const tokens = this.tokenService.generateTokenPair({
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email,
      role: user.role,
    });

    return Result.ok(tokens);
  }
}
