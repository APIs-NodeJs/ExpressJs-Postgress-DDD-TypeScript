import { AggregateRoot } from "../../../../core/domain/AggregateRoot";
import { Result } from "../../../../core/domain/Result";
import { UserId } from "../value-objects/UserId.vo";
import { Email } from "../value-objects/Email.vo";
import { Password } from "../value-objects/Password.vo";
import {
  UserCreatedEvent,
  UserLoggedInEvent,
  UserPasswordChangedEvent,
  UserEmailVerifiedEvent,
  UserDeletedEvent,
  UserRestoredEvent,
} from "../events/UserEvents";

export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export interface UserProps {
  id: string;
  email: Email;
  password: Password;
  workspaceId: string;
  status: UserStatus;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  deletedAt?: Date | null;
  deletedBy?: string;
}

export class User extends AggregateRoot<string> {
  private props: UserProps;

  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get firstName(): string | undefined {
    return this.props.firstName;
  }

  get lastName(): string | undefined {
    return this.props.lastName;
  }

  get fullName(): string {
    if (this.props.firstName && this.props.lastName) {
      return `${this.props.firstName} ${this.props.lastName}`;
    }
    return this.props.email.value;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null && this.props.deletedAt !== undefined;
  }

  private constructor(
    id: string,
    props: UserProps,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  /**
   * Soft delete user
   */
  public softDelete(deletedBy?: string): Result<void> {
    if (this.isDeleted) {
      return Result.fail<void>("User is already deleted");
    }

    this.props.deletedAt = new Date();
    this.props.deletedBy = deletedBy;
    this.props.status = UserStatus.DELETED;
    this.touch();

    this.addDomainEvent(
      new UserDeletedEvent(this.id, this.props.email.value, false, deletedBy)
    );

    return Result.ok();
  }

  /**
   * Restore soft deleted user
   */
  public restore(): Result<void> {
    if (!this.isDeleted) {
      return Result.fail<void>("User is not deleted");
    }

    this.props.deletedAt = null;
    this.props.deletedBy = undefined;
    this.props.status = UserStatus.ACTIVE;
    this.touch();

    this.addDomainEvent(new UserRestoredEvent(this.id, this.props.email.value));

    return Result.ok();
  }

  /**
   * Hard delete user (permanent)
   */
  public hardDelete(deletedBy?: string): Result<void> {
    this.props.status = UserStatus.DELETED;
    this.touch();

    this.addDomainEvent(
      new UserDeletedEvent(this.id, this.props.email.value, true, deletedBy)
    );

    return Result.ok();
  }

  public changePassword(newPassword: Password): Result<void> {
    if (this.props.status !== UserStatus.ACTIVE) {
      return Result.fail<void>("Cannot change password for inactive user");
    }

    this.props.password = newPassword;
    this.touch();

    this.addDomainEvent(
      new UserPasswordChangedEvent(this.id, this.props.email.value)
    );

    return Result.ok();
  }

  public verifyEmail(): Result<void> {
    if (this.props.emailVerified) {
      return Result.fail<void>("Email already verified");
    }

    this.props.emailVerified = true;
    this.props.status = UserStatus.ACTIVE;
    this.touch();

    this.addDomainEvent(
      new UserEmailVerifiedEvent(this.id, this.props.email.value)
    );

    return Result.ok();
  }

  public recordLogin(ipAddress?: string): void {
    this.addDomainEvent(
      new UserLoggedInEvent(this.id, this.props.email.value, ipAddress)
    );
  }

  public static create(
    email: Email,
    password: Password,
    workspaceId: string,
    id?: string,
    firstName?: string,
    lastName?: string
  ): Result<User> {
    const userId = id || UserId.create().getValue().value;

    const props: UserProps = {
      id: userId,
      email,
      password,
      workspaceId,
      status: UserStatus.PENDING,
      emailVerified: false,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      deletedAt: null,
    };

    const user = new User(userId, props);

    user.addDomainEvent(new UserCreatedEvent(userId, email.value, workspaceId));

    return Result.ok(user);
  }
}
