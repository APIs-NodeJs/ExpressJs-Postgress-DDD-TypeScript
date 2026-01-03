// src/modules/auth/infrastructure/repositories/session.repository.ts

import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { Session } from '../../domain/entities/session.entity';
import { RefreshToken } from '../../domain/value-objects/refresh-token.value-object';
import { SessionModel } from '../models/session.model';
import { Op } from 'sequelize';

export class SessionRepository implements ISessionRepository {
  async save(session: Session): Promise<Session> {
    const sessionProps = session.toObject();

    const model = await SessionModel.create({
      id: sessionProps.id,
      user_id: sessionProps.userId,
      refresh_token: sessionProps.refreshToken.getValue(),
      expires_at: sessionProps.refreshToken.getExpiresAt(),
      ip_address: sessionProps.ipAddress,
      user_agent: sessionProps.userAgent,
      is_revoked: sessionProps.isRevoked,
    });

    return this.toDomain(model);
  }

  async findById(id: string): Promise<Session | null> {
    const model = await SessionModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findByRefreshToken(refreshToken: RefreshToken): Promise<Session | null> {
    const model = await SessionModel.findOne({
      where: { refresh_token: refreshToken.getValue() },
    });
    return model ? this.toDomain(model) : null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const models = await SessionModel.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });

    return models.map((model) => this.toDomain(model));
  }

  async update(session: Session): Promise<Session> {
    const sessionProps = session.toObject();

    await SessionModel.update(
      {
        refresh_token: sessionProps.refreshToken.getValue(),
        expires_at: sessionProps.refreshToken.getExpiresAt(),
        ip_address: sessionProps.ipAddress,
        user_agent: sessionProps.userAgent,
        is_revoked: sessionProps.isRevoked,
      },
      {
        where: { id: sessionProps.id },
      }
    );

    const updated = await SessionModel.findByPk(sessionProps.id);
    if (!updated) {
      throw new Error('Session not found after update');
    }

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await SessionModel.destroy({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await SessionModel.destroy({
      where: { user_id: userId },
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await SessionModel.update({ is_revoked: true }, { where: { user_id: userId } });
  }

  async deleteExpired(): Promise<void> {
    await SessionModel.destroy({
      where: {
        expires_at: {
          [Op.lt]: new Date(),
        },
      },
    });
  }

  private toDomain(model: SessionModel): Session {
    return Session.fromPersistence({
      id: model.id,
      userId: model.user_id,
      refreshToken: RefreshToken.fromExisting(model.refresh_token, model.expires_at),
      ipAddress: model.ip_address,
      userAgent: model.user_agent,
      isRevoked: model.is_revoked,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
    });
  }
}
