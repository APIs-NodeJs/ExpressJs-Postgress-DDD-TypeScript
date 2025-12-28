// src/modules/users/domain/entities/User.ts
import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { UniqueEntityID } from '../../../../core/domain/Identifier';
import { Result } from '../../../../core/domain/Result';
import { Email } from '../valueObjects/Email';
import { UserRole } from '../valueObjects/UserRole';
import { UserCreatedEvent } from '../events/UserCreatedEvent';
import { UserPasswordChangedEvent } from '../events/UserPasswordChangedEvent';

interface UserProps {
  email: Email;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  googleId?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends AggregateRoot<string> {
  private props: UserProps;

  private constructor(props: UserProps, id?: UniqueEntityID) {
    super(
      id?.toValue() || new UniqueEntityID().toValue(),
      props.createdAt,
      props.updatedAt
    );
    this.props = props;
  }

  get email(): Email {
    return this.props.email;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get passwordHash(): string | undefined {
    return this.props.passwordHash;
  }

  get googleId(): string | undefined {
    return this.props.googleId;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  public static create(
    props: {
      email: Email;
      firstName: string;
      lastName: string;
      passwordHash?: string;
      googleId?: string;
      role?: UserRole;
      isActive?: boolean;
      emailVerified?: boolean;
    },
    id?: UniqueEntityID
  ): Result<User> {
    if (!props.email) {
      return Result.fail<User>('Email is required');
    }

    if (!props.firstName || props.firstName.trim().length === 0) {
      return Result.fail<User>('First name is required');
    }

    if (!props.lastName || props.lastName.trim().length === 0) {
      return Result.fail<User>('Last name is required');
    }

    if (!props.passwordHash && !props.googleId) {
      return Result.fail<User>('Either password or Google ID is required');
    }

    const user = new User(
      {
        email: props.email,
        firstName: props.firstName.trim(),
        lastName: props.lastName.trim(),
        passwordHash: props.passwordHash,
        googleId: props.googleId,
        role: props.role || UserRole.USER,
        isActive: props.isActive ?? true,
        emailVerified: props.emailVerified ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id
    );

    if (!id) {
      user.addDomainEvent(
        new UserCreatedEvent(user.id, {
          email: props.email.value,
          firstName: props.firstName,
          lastName: props.lastName,
        })
      );
    }

    return Result.ok<User>(user);
  }

  public changePassword(newPasswordHash: string): Result<void> {
    if (!newPasswordHash || newPasswordHash.trim().length === 0) {
      return Result.fail<void>('Password hash is required');
    }

    this.props.passwordHash = newPasswordHash;
    this.touch();

    this.addDomainEvent(new UserPasswordChangedEvent(this.id));

    return Result.ok<void>();
  }

  public verifyEmail(): void {
    this.props.emailVerified = true;
    this.touch();
  }

  public updateLastLogin(): void {
    this.props.lastLoginAt = new Date();
    this.touch();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  public activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  public changeRole(newRole: UserRole): void {
    this.props.role = newRole;
    this.touch();
  }

  public isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  public canAuthenticate(): boolean {
    return this.props.isActive && this.props.emailVerified;
  }
}
