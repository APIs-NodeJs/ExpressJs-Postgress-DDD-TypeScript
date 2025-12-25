export interface UserSession {
  sessionId: string;
  userId: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
}

export interface ISessionService {
  createSession(
    userId: string,
    refreshToken: string,
    metadata?: Partial<UserSession>
  ): Promise<UserSession>;
  getSession(sessionId: string): Promise<UserSession | null>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  updateLastAccessed(sessionId: string): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
}
