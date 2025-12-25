export interface ITokenBlacklistService {
  blacklist(token: string, expiresIn: number): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
  cleanup(): Promise<void>;
}
