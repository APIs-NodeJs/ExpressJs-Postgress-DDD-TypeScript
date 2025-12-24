export interface TokenPayload {
  userId: string;
  workspaceId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ITokenService {
  generateTokenPair(payload: TokenPayload): TokenPair;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
}
