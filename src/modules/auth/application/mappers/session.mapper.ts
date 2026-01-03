// src/modules/auth/application/mappers/session.mapper.ts

export class SessionMapper {
  static toDto(session: Session): SessionResponseDto {
    return {
      id: session.getId(),
      userId: session.getUserId(),
      ipAddress: session.getIpAddress(),
      userAgent: session.getUserAgent(),
      createdAt: session.getCreatedAt(),
      expiresAt: session.getRefreshToken().getExpiresAt(),
      isRevoked: session.getIsRevoked(),
    };
  }

  static toDtoList(sessions: Session[]): SessionResponseDto[] {
    return sessions.map((session) => this.toDto(session));
  }
}
