// src/modules/auth/domain/repositories/IRefreshTokenRepository.ts
import { IRepository } from '../../../../core/application/ports/IRepository';
import { RefreshToken } from '../entities/RefreshToken';

export interface IRefreshTokenRepository extends IRepository<RefreshToken, string> {
  findByToken(token: string): Promise<RefreshToken | null>;
  findByUserId(userId: string): Promise<RefreshToken[]>;
  revokeAllByUserId(userId: string): Promise<void>;
}
