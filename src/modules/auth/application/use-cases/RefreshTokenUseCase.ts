import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { JwtService } from "@modules/auth/infrastructure/security/JwtService";
import { RefreshTokenRequest } from "../dtos/AuthRequestDtos";
import { TokensDto } from "../dtos/AuthResponseDtos";

export class RefreshTokenUseCase
  implements UseCase<RefreshTokenRequest, Result<TokensDto>>
{
  async execute(request: RefreshTokenRequest): Promise<Result<TokensDto>> {
    try {
      const payload = JwtService.verifyRefreshToken(request.refreshToken);

      const tokens = JwtService.generateTokens({
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        email: payload.email,
      });

      return Result.ok<TokensDto>(tokens);
    } catch (error) {
      return Result.fail<TokensDto>("Invalid or expired refresh token");
    }
  }
}
