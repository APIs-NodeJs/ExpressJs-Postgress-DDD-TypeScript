import { ITokenBlacklistService } from "../../domain/services/ITokenBlacklistService";
import { createHash } from "crypto";
import { Logger } from "../../../../shared/infrastructure/logger/logger";

interface BlacklistedToken {
  hash: string;
  expiresAt: number;
}

export class InMemoryTokenBlacklistService implements ITokenBlacklistService {
  private blacklist: Map<string, BlacklistedToken> = new Map();
  private cleanupInterval: NodeJS.Timer;

  constructor() {
    // Clean up expired tokens every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  async blacklist(token: string, expiresIn: number): Promise<void> {
    try {
      const tokenHash = this.hashToken(token);
      const expiresAt = Date.now() + expiresIn * 1000;

      this.blacklist.set(tokenHash, {
        hash: tokenHash,
        expiresAt,
      });

      Logger.debug("Token blacklisted", {
        tokenHash: tokenHash.substring(0, 8),
        expiresAt: new Date(expiresAt).toISOString(),
      });
    } catch (error) {
      Logger.error("Failed to blacklist token", error);
      throw error;
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);
      const entry = this.blacklist.get(tokenHash);

      if (!entry) {
        return false;
      }

      // Check if token has expired
      if (Date.now() > entry.expiresAt) {
        this.blacklist.delete(tokenHash);
        return false;
      }

      return true;
    } catch (error) {
      Logger.error("Failed to check blacklist status", error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    let removedCount = 0;

    for (const [hash, entry] of this.blacklist.entries()) {
      if (now > entry.expiresAt) {
        this.blacklist.delete(hash);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      Logger.debug("Cleaned up expired tokens", { removedCount });
    }
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  // Get stats for monitoring
  getStats(): { total: number; active: number } {
    const now = Date.now();
    let active = 0;

    for (const entry of this.blacklist.values()) {
      if (now <= entry.expiresAt) {
        active++;
      }
    }

    return {
      total: this.blacklist.size,
      active,
    };
  }

  // Cleanup on shutdown
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.blacklist.clear();
  }
}
