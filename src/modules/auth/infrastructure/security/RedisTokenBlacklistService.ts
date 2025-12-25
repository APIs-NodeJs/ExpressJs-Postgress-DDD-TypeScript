import { RedisClient } from "./../../../../infrastructure/cache/RedisClient";
import { ITokenBlacklistService } from "../../domain/services/ITokenBlacklistService";
import { createHash } from "crypto";
export class RedisTokenBlacklistService implements ITokenBlacklistService {
  constructor(private redis: RedisClient) {}

  async blacklist(token: string, expiresIn: number): Promise<void> {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await this.redis.set(`blacklist:${tokenHash}`, "1", expiresIn);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    return await this.redis.exists(`blacklist:${tokenHash}`);
  }

  async cleanup(): Promise<void> {
    // Redis TTL handles cleanup automatically
  }
}
