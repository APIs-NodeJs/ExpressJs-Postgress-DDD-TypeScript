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
} from "../events/UserEvents";

export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

interface UserProps {
  email: Email;
  password: Password;
  workspaceId: string;
  status: UserStatus;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
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

  private constructor(
    id: string,
    props: UserProps,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
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

  public suspend(): Result<void> {
    if (this.props.status === UserStatus.DELETED) {
      return Result.fail<void>("Cannot suspend deleted user");
    }

    this.props.status = UserStatus.SUSPENDED;
    this.touch();

    return Result.ok();
  }

  public activate(): Result<void> {
    if (this.props.status === UserStatus.DELETED) {
      return Result.fail<void>("Cannot activate deleted user");
    }

    this.props.status = UserStatus.ACTIVE;
    this.touch();

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
    id?: string
  ): Result<User> {
    const userId = id || UserId.create().getValue().value;

    const props: UserProps = {
      email,
      password,
      workspaceId,
      status: UserStatus.PENDING,
      emailVerified: false,
    };

    const user = new User(userId, props);

    user.addDomainEvent(new UserCreatedEvent(userId, email.value, workspaceId));

    return Result.ok(user);
  }
}
