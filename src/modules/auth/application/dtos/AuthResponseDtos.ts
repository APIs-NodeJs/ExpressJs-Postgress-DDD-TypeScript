export interface AuthUserDto {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponseDto {
  user: AuthUserDto;
  tokens: TokensDto;
}
