// src/modules/auth/domain/aggregates/User.aggregate.ts
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
  UserAssignedToWorkspaceEvent,
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
  workspaceId: string | null; // Now nullable - users can exist without workspace
  status: UserStatus;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
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

  get workspaceId(): string | null {
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
    if (this.props.firstName) {
      return this.props.firstName;
    }
    return this.props.email.value;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null && this.props.deletedAt !== undefined;
  }

  get hasWorkspace(): boolean {
    return this.props.workspaceId !== null;
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
   * Business Rules
   */
  private canChangePassword(): Result<void> {
    if (this.props.status !== UserStatus.ACTIVE) {
      return Result.fail<void>("Cannot change password for inactive user");
    }

    if (this.isDeleted) {
      return Result.fail<void>("Cannot change password for deleted user");
    }

    return Result.ok();
  }

  private canVerifyEmail(): Result<void> {
    if (this.props.emailVerified) {
      return Result.fail<void>("Email already verified");
    }

    if (this.isDeleted) {
      return Result.fail<void>("Cannot verify email for deleted user");
    }

    return Result.ok();
  }

  /**
   * Assign user to workspace
   */
  public assignToWorkspace(workspaceId: string): Result<void> {
    if (!workspaceId) {
      return Result.fail<void>("Workspace ID is required");
    }

    if (this.props.workspaceId === workspaceId) {
      return Result.fail<void>("User already assigned to this workspace");
    }

    if (this.isDeleted) {
      return Result.fail<void>("Cannot assign deleted user to workspace");
    }

    const previousWorkspaceId = this.props.workspaceId;
    this.props.workspaceId = workspaceId;
    this.touch();

    // Emit domain event
    this.addDomainEvent(
      new UserAssignedToWorkspaceEvent(
        this.id,
        workspaceId,
        previousWorkspaceId
      )
    );

    return Result.ok();
  }

  /**
   * Remove user from workspace
   */
  public removeFromWorkspace(): Result<void> {
    if (!this.hasWorkspace) {
      return Result.fail<void>("User is not assigned to any workspace");
    }

    this.props.workspaceId = null;
    this.touch();

    return Result.ok();
  }

  /**
   * Change password
   */
  public changePassword(newPassword: Password): Result<void> {
    const canChangeResult = this.canChangePassword();
    if (canChangeResult.isFailure) {
      return canChangeResult;
    }

    this.props.password = newPassword;
    this.touch();

    this.addDomainEvent(
      new UserPasswordChangedEvent(this.id, this.props.email.value)
    );

    return Result.ok();
  }

  /**
   * Verify email
   */
  public verifyEmail(): Result<void> {
    const canVerifyResult = this.canVerifyEmail();
    if (canVerifyResult.isFailure) {
      return canVerifyResult;
    }

    this.props.emailVerified = true;
    this.props.status = UserStatus.ACTIVE;
    this.touch();

    this.addDomainEvent(
      new UserEmailVerifiedEvent(this.id, this.props.email.value)
    );

    return Result.ok();
  }

  /**
   * Record login
   */
  public recordLogin(ipAddress?: string): void {
    this.props.lastLoginAt = new Date();
    this.props.lastLoginIp = ipAddress;
    this.touch();

    this.addDomainEvent(
      new UserLoggedInEvent(this.id, this.props.email.value, ipAddress)
    );
  }

  /**
   * Update profile
   */
  public updateProfile(firstName?: string, lastName?: string): Result<void> {
    if (this.isDeleted) {
      return Result.fail<void>("Cannot update profile for deleted user");
    }

    if (firstName !== undefined) {
      if (firstName.length > 100) {
        return Result.fail<void>("First name too long");
      }
      this.props.firstName = firstName.trim() || undefined;
    }

    if (lastName !== undefined) {
      if (lastName.length > 100) {
        return Result.fail<void>("Last name too long");
      }
      this.props.lastName = lastName.trim() || undefined;
    }

    this.touch();

    return Result.ok();
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

  /**
   * Suspend user
   */
  public suspend(): Result<void> {
    if (this.isDeleted) {
      return Result.fail<void>("Cannot suspend deleted user");
    }

    if (this.props.status === UserStatus.SUSPENDED) {
      return Result.fail<void>("User is already suspended");
    }

    this.props.status = UserStatus.SUSPENDED;
    this.touch();

    return Result.ok();
  }

  /**
   * Activate user
   */
  public activate(): Result<void> {
    if (this.isDeleted) {
      return Result.fail<void>("Cannot activate deleted user");
    }

    this.props.status = UserStatus.ACTIVE;
    this.touch();

    return Result.ok();
  }

  /**
   * Factory Methods
   */

  /**
   * Create new user WITHOUT workspace (workspace assigned later)
   */
  public static create(
    email: Email,
    password: Password,
    id?: string,
    firstName?: string,
    lastName?: string
  ): Result<User> {
    const userId = id || UserId.create().getValue().value;

    const props: UserProps = {
      id: userId,
      email,
      password,
      workspaceId: null, // No workspace initially
      status: UserStatus.PENDING,
      emailVerified: false,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      deletedAt: null,
    };

    const user = new User(userId, props);

    user.addDomainEvent(new UserCreatedEvent(userId, email.value));

    return Result.ok(user);
  }

  /**
   * Create user WITH workspace (for backward compatibility)
   */
  public static createWithWorkspace(
    email: Email,
    password: Password,
    workspaceId: string,
    id?: string,
    firstName?: string,
    lastName?: string
  ): Result<User> {
    const userResult = User.create(email, password, id, firstName, lastName);

    if (userResult.isFailure) {
      return userResult;
    }

    const user = userResult.getValue();
    const assignResult = user.assignToWorkspace(workspaceId);

    if (assignResult.isFailure) {
      return Result.fail<User>(assignResult.error!);
    }

    return Result.ok(user);
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    email: Email,
    password: Password,
    workspaceId: string | null,
    status: UserStatus,
    emailVerified: boolean,
    firstName: string | undefined,
    lastName: string | undefined,
    lastLoginAt: Date | undefined,
    deletedAt: Date | null,
    deletedBy: string | undefined,
    createdAt: Date,
    updatedAt: Date
  ): Result<User> {
    const props: UserProps = {
      id,
      email,
      password,
      workspaceId,
      status,
      emailVerified,
      firstName,
      lastName,
      lastLoginAt,
      deletedAt,
      deletedBy,
    };

    return Result.ok(new User(id, props, createdAt, updatedAt));
  }
}
