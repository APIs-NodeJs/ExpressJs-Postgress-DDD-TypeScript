// src/modules/auth/application/use-cases/logout.use-case.ts

import { RefreshToken } from '../../domain/value-objects/refresh-token.value-object';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { NotFoundError } from '@core/errors';
import { UserLoggedOutEvent } from '../../domain/events/user-logged-out.event';

export interface LogoutUseCaseInput {
  refreshToken: string;
}

export class LogoutUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(input: LogoutUseCaseInput): Promise<void> {
    // Find session
    const session = await this.sessionRepository.findByRefreshToken(
      RefreshToken.fromExisting(input.refreshToken, new Date())
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Revoke session
    session.revoke();
    await this.sessionRepository.update(session);

    // Emit domain event
    const event = new UserLoggedOutEvent({
      userId: session.getUserId(),
      sessionId: session.getId(),
      loggedOutAt: new Date(),
    });
  }
}
