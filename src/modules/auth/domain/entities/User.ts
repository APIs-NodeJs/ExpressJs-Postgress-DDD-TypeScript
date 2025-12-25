import { v4 as uuidv4 } from "uuid";
import { Role } from "../../../../config/constants";

export interface UserProps {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  workspaceId: string;
  emailVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
}

// Add domain events
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
    public readonly workspaceId: string
  ) {
    super();
  }
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly password: string;
  public readonly name: string;
  public readonly role: Role;
  public readonly workspaceId: string;
  public readonly emailVerified: boolean;
  public readonly verificationToken: string | null;
  public readonly verificationTokenExpires: Date | null;

  private constructor(props: UserProps) {
    this.id = props.id || uuidv4();
    this.email = props.email;
    this.password = props.password;
    this.name = props.name;
    this.role = props.role;
    this.workspaceId = props.workspaceId;
    this.emailVerified = props.emailVerified ?? false;
    this.verificationToken = props.verificationToken ?? null;
    this.verificationTokenExpires = props.verificationTokenExpires ?? null;
  }

  public static create(props: UserProps): User {
    const user = new User(props);
    user.addDomainEvent(
      new UserCreatedEvent(user.id, user.email, user.workspaceId)
    );
    return user;
  }

  public toDTO() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      workspaceId: this.workspaceId,
      emailVerified: this.emailVerified,
    };
  }

  private _domainEvents: DomainEvent[] = [];

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
