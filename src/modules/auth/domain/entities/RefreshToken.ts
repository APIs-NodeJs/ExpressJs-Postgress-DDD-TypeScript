// src/modules/auth/domain/entities/RefreshToken.ts
import { Entity } from '../../../../core/domain/Entity';
import { UniqueEntityID } from '../../../../core/domain/Identifier';
import { Result } from '../../../../core/domain/Result';

interface RefreshTokenProps {
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RefreshToken extends Entity<string> {
  private props: RefreshTokenProps;

  private constructor(props: RefreshTokenProps, id?: UniqueEntityID) {
    super(
      id?.toValue() || new UniqueEntityID().toValue(),
      props.createdAt,
      props.updatedAt
    );
    this.props = props;
  }

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

  public static create(
    props: {
      userId: string;
      token: string;
      expiresAt: Date;
    },
    id?: UniqueEntityID
  ): Result<RefreshToken> {
    if (!props.userId) {
      return Result.fail<RefreshToken>('User ID is required');
    }

    if (!props.token) {
      return Result.fail<RefreshToken>('Token is required');
    }

    if (!props.expiresAt) {
      return Result.fail<RefreshToken>('Expiration date is required');
    }

    const refreshToken = new RefreshToken(
      {
        userId: props.userId,
        token: props.token,
        expiresAt: props.expiresAt,
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id
    );

    return Result.ok<RefreshToken>(refreshToken);
  }

  public revoke(): void {
    this.props.isRevoked = true;
    this.touch();
  }

  public isExpired(): boolean {
    return this.props.expiresAt < new Date();
  }

  public isValid(): boolean {
    return !this.props.isRevoked && !this.isExpired();
  }
}
