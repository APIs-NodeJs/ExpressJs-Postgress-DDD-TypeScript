import { v4 as uuidv4 } from "uuid";
import {
  ISessionService,
  UserSession,
} from "../../domain/services/ISessionService";
import { Logger } from "../../../../shared/infrastructure/logger/logger";

export class SessionService implements ISessionService {
  private sessions: Map<string, UserSession> = new Map();
  private userSessionIndex: Map<string, Set<string>> = new Map();

  async createSession(
    userId: string,
    refreshToken: string,
    metadata?: Partial<UserSession>
  ): Promise<UserSession> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session: UserSession = {
      sessionId,
      userId,
      refreshToken,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt,
    };

    this.sessions.set(sessionId, session);

    // Update user session index
    if (!this.userSessionIndex.has(userId)) {
      this.userSessionIndex.set(userId, new Set());
    }
    this.userSessionIndex.get(userId)!.add(sessionId);

    Logger.debug("Session created", {
      sessionId,
      userId,
      expiresAt: expiresAt.toISOString(),
    });

    return session;
  }

  async getSession(sessionId: string): Promise<UserSession | null> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      await this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    const sessionIds = this.userSessionIndex.get(userId);

    if (!sessionIds) {
      return [];
    }

    const sessions: UserSession[] = [];
    const now = new Date();

    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);

      if (session && now <= session.expiresAt) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  async updateLastAccessed(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.lastAccessedAt = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session) {
      // Remove from user index
      const userSessions = this.userSessionIndex.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessionIndex.delete(session.userId);
        }
      }

      this.sessions.delete(sessionId);

      Logger.debug("Session deleted", { sessionId, userId: session.userId });
    }
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const sessionIds = this.userSessionIndex.get(userId);

    if (!sessionIds) {
      return;
    }

    for (const sessionId of sessionIds) {
      this.sessions.delete(sessionId);
    }

    this.userSessionIndex.delete(userId);

    Logger.info("All user sessions deleted", {
      userId,
      count: sessionIds.size,
    });
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        await this.deleteSession(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      Logger.debug("Cleaned up expired sessions", { count: cleanedCount });
    }
  }

  // Get session stats
  getStats(): {
    totalSessions: number;
    activeUsers: number;
  } {
    return {
      totalSessions: this.sessions.size,
      activeUsers: this.userSessionIndex.size,
    };
  }
}
