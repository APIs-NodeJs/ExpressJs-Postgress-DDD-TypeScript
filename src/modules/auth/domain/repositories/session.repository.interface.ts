// src/modules/auth/domain/repositories/session.repository.interface.ts

import { Session } from '../entities/session.entity';
import { RefreshToken } from '../value-objects/refresh-token.value-object';

export interface ISessionRepository {
  save(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByRefreshToken(refreshToken: RefreshToken): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  update(session: Session): Promise<Session>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
