import { v4 as uuidv4 } from "uuid";
import { Role } from "../../../../config/constants";

/**
 * Complete User properties including all extended fields
 */
export interface UserProps {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  workspaceId: string;

  // Email verification
  emailVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;

  // Password reset
  resetToken?: string | null;
  resetTokenExpires?: Date | null;

  // Two-factor authentication
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  backupCodes?: string[] | null;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Domain Events
 */
export abstract class DomainEvent {
  public readonly occurredAt: Date;
  constructor() {
    this.occurredAt = new Date();
  }
}

export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly workspaceId: string,
    public readonly role: string
  ) {
    super();
  }
}

export class UserEmailVerifiedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super();
  }
}

export class UserPasswordChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super();
  }
}

export class TwoFactorEnabledEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super();
  }
}

/**
 * User Entity - Aggregate Root
 */
export class User {
  // Core fields
  public readonly id: string;
  public readonly email: string;
  public readonly password: string;
  public readonly name: string;
  public readonly role: Role;
  public readonly workspaceId: string;

  // Email verification
  public readonly emailVerified: boolean;
  public readonly verificationToken: string | null;
  public readonly verificationTokenExpires: Date | null;

  // Password reset
  public readonly resetToken: string | null;
  public readonly resetTokenExpires: Date | null;

  // Two-factor authentication
  public readonly twoFactorEnabled: boolean;
  public readonly twoFactorSecret: string | null;
  public readonly backupCodes: string[] | null;

  // Timestamps
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  // Domain events
  private _domainEvents: DomainEvent[] = [];

  private constructor(props: UserProps) {
    this.id = props.id || uuidv4();
    this.email = props.email;
    this.password = props.password;
    this.name = props.name;
    this.role = props.role;
    this.workspaceId = props.workspaceId;

    // Email verification
    this.emailVerified = props.emailVerified ?? false;
    this.verificationToken = props.verificationToken ?? null;
    this.verificationTokenExpires = props.verificationTokenExpires ?? null;

    // Password reset
    this.resetToken = props.resetToken ?? null;
    this.resetTokenExpires = props.resetTokenExpires ?? null;

    // Two-factor authentication
    this.twoFactorEnabled = props.twoFactorEnabled ?? false;
    this.twoFactorSecret = props.twoFactorSecret ?? null;
    this.backupCodes = props.backupCodes ?? null;

    // Timestamps
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * Factory method to create a new user
   */
  public static create(props: UserProps): User {
    const user = new User(props);

    // Emit UserCreated event
    user.addDomainEvent(
      new UserCreatedEvent(user.id, user.email, user.workspaceId, user.role)
    );

    return user;
  }

  /**
   * Reconstruct user from persistence
   */
  public static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  /**
   * Mark email as verified
   */
  public verifyEmail(): User {
    const updated = User.fromPersistence({
      ...this,
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
      updatedAt: new Date(),
    });

    updated.addDomainEvent(new UserEmailVerifiedEvent(this.id, this.email));

    return updated;
  }

  /**
   * Change password
   */
  public changePassword(newPasswordHash: string): User {
    const updated = User.fromPersistence({
      ...this,
      password: newPasswordHash,
      resetToken: null,
      resetTokenExpires: null,
      updatedAt: new Date(),
    });

    updated.addDomainEvent(new UserPasswordChangedEvent(this.id, this.email));

    return updated;
  }

  /**
   * Enable two-factor authentication
   */
  public enableTwoFactor(secret: string, backupCodes: string[]): User {
    const updated = User.fromPersistence({
      ...this,
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      backupCodes,
      updatedAt: new Date(),
    });

    updated.addDomainEvent(new TwoFactorEnabledEvent(this.id, this.email));

    return updated;
  }

  /**
   * Convert to DTO for API responses (excludes sensitive data)
   */
  public toDTO(): Record<string, any> {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      workspaceId: this.workspaceId,
      emailVerified: this.emailVerified,
      twoFactorEnabled: this.twoFactorEnabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Domain events management
   */
  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Business rule validations
   */
  public canResetPassword(): boolean {
    return (
      this.resetToken !== null &&
      this.resetTokenExpires !== null &&
      this.resetTokenExpires > new Date()
    );
  }

  public canVerifyEmail(): boolean {
    return (
      !this.emailVerified &&
      this.verificationToken !== null &&
      this.verificationTokenExpires !== null &&
      this.verificationTokenExpires > new Date()
    );
  }

  public hasTwoFactor(): boolean {
    return this.twoFactorEnabled && this.twoFactorSecret !== null;
  }

  public isOwner(): boolean {
    return this.role === "owner";
  }

  public isAdmin(): boolean {
    return this.role === "admin" || this.role === "owner";
  }
}
