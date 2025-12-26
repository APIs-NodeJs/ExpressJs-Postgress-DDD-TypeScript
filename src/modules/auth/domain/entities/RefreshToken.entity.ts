import { Entity } from "../../../../core/domain/Entity";
import { Result } from "../../../../core/domain/Result";

interface RefreshTokenProps {
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
}

export class RefreshToken extends Entity<string> {
  private props: RefreshTokenProps;

  get userId(): string {
    return this.props.userId;
  }

  get token(): string {
    return this.props.token;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get isRevoked(): boolean {
    return this.props.isRevoked;
  }

  private constructor(id: string, props: RefreshTokenProps) {
    super(id);
    this.props = props;
  }

  public revoke(): void {
    this.props.isRevoked = true;
    this.touch();
  }

  public isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  public isValid(): boolean {
    return !this.props.isRevoked && !this.isExpired();
  }

  public static create(
    userId: string,
    token: string,
    expiresAt: Date,
    id?: string
  ): Result<RefreshToken> {
    if (!userId) {
      return Result.fail<RefreshToken>("User ID is required");
    }

    if (!token) {
      return Result.fail<RefreshToken>("Token is required");
    }

    if (!expiresAt) {
      return Result.fail<RefreshToken>("Expiration date is required");
    }

    const tokenId = id || `refresh_${Date.now()}`;
    const props: RefreshTokenProps = {
      userId,
      token,
      expiresAt,
      isRevoked: false,
    };

    return Result.ok(new RefreshToken(tokenId, props));
  }
}
