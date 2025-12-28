// src/modules/auth/infrastructure/persistence/repositories/RefreshTokenRepository.ts
import { BaseRepository } from '../../../../../core/infrastructure/persistence/BaseRepository';
import { RefreshToken } from '../../../domain/entities/RefreshToken';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { RefreshTokenModel } from '../models/RefreshTokenModel';
import { UniqueEntityID } from '../../../../../core/domain/Identifier';

export class RefreshTokenRepository
  extends BaseRepository<RefreshToken, RefreshTokenModel, string>
  implements IRefreshTokenRepository
{
  async findById(id: string): Promise<RefreshToken | null> {
    const model = await RefreshTokenModel.findByPk(id, {
      transaction: this.getTransaction(),
    });

    if (!model) return null;
    return this.toDomain(model);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const model = await RefreshTokenModel.findOne({
      where: { token },
      transaction: this.getTransaction(),
    });

    if (!model) return null;
    return this.toDomain(model);
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const models = await RefreshTokenModel.findAll({
      where: { userId },
      transaction: this.getTransaction(),
    });

    return models.map(model => this.toDomain(model));
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await RefreshTokenModel.update(
      { isRevoked: true },
      {
        where: { userId, isRevoked: false },
        transaction: this.getTransaction(),
      }
    );
  }

  async save(refreshToken: RefreshToken): Promise<void> {
    const exists = await this.exists(refreshToken.id);
    const persistence = this.toPersistence(refreshToken);

    if (exists) {
      await RefreshTokenModel.update(persistence, {
        where: { id: refreshToken.id },
        transaction: this.getTransaction(),
      });
    } else {
      await RefreshTokenModel.create(persistence as any, {
        transaction: this.getTransaction(),
      });
    }
  }

  async delete(id: string): Promise<void> {
    await RefreshTokenModel.destroy({
      where: { id },
      transaction: this.getTransaction(),
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await RefreshTokenModel.count({
      where: { id },
      transaction: this.getTransaction(),
    });
    return count > 0;
  }

  protected toDomain(model: RefreshTokenModel): RefreshToken {
    const result = RefreshToken.create(
      {
        userId: model.userId,
        token: model.token,
        expiresAt: model.expiresAt,
      },
      new UniqueEntityID(model.id)
    );

    if (result.isFailure) {
      throw new Error('Failed to create refresh token domain entity');
    }

    const token = result.getValue();
    if (model.isRevoked) {
      token.revoke();
    }

    return token;
  }

  protected toPersistence(refreshToken: RefreshToken): Partial<RefreshTokenModel> {
    return {
      id: refreshToken.id,
      userId: refreshToken.userId,
      token: refreshToken.token,
      expiresAt: refreshToken.expiresAt,
      isRevoked: refreshToken.isRevoked,
      updatedAt: refreshToken.updatedAt,
    };
  }
}
