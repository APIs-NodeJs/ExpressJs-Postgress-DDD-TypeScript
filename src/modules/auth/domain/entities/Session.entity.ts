import { Entity } from "../../../../core/domain/Entity";
import { Result } from "../../../../core/domain/Result";

interface SessionProps {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class Session extends Entity<string> {
  private props: SessionProps;

  get userId(): string {
    return this.props.userId;
  }

  get token(): string {
    return this.props.token;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }

  get userAgent(): string | undefined {
    return this.props.userAgent;
  }

  private constructor(id: string, props: SessionProps) {
    super(id);
    this.props = props;
  }

  public isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  public static create(props: SessionProps, id?: string): Result<Session> {
    if (!props.userId) {
      return Result.fail<Session>("User ID is required");
    }

    if (!props.token) {
      return Result.fail<Session>("Token is required");
    }

    if (!props.expiresAt) {
      return Result.fail<Session>("Expiration date is required");
    }

    const sessionId = id || `session_${Date.now()}`;
    return Result.ok(new Session(sessionId, props));
  }
}
