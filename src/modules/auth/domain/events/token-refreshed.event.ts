// src/modules/auth/domain/events/token-refreshed.event.ts

export interface TokenRefreshedEventPayload {
  userId: string;
  sessionId: string;
  refreshedAt: Date;
}

export class TokenRefreshedEvent {
  readonly eventName = 'token.refreshed';
  readonly occurredAt: Date;
  readonly payload: TokenRefreshedEventPayload;

  constructor(payload: TokenRefreshedEventPayload) {
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
