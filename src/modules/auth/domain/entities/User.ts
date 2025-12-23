import { AggregateRoot } from "@shared/domain/AggregateRoot";
import { v4 as uuidv4 } from "uuid";
import { Email } from "../value-objects/Email";
import { Password } from "../value-objects/Password";

interface UserProps {
  email: Email;
  password: Password;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  protected generateId(): string {
    return uuidv4();
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get name(): string {
    return this.props.name;
  }

  get avatar(): string | undefined {
    return this.props.avatar;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateProfile(name: string, avatar?: string): void {
    this.props.name = name;
    if (avatar) {
      this.props.avatar = avatar;
    }
    this.props.updatedAt = new Date();
  }

  public updatePassword(newPassword: Password): void {
    this.props.password = newPassword;
    this.props.updatedAt = new Date();
  }

  public verifyEmail(): void {
    this.props.emailVerified = true;
    this.props.updatedAt = new Date();
  }

  public static create(
    props: {
      email: Email;
      password: Password;
      name: string;
      workspaceId: string;
      avatar?: string;
      emailVerified?: boolean;
    },
    id?: string
  ): User {
    return new User(
      {
        email: props.email,
        password: props.password,
        name: props.name,
        avatar: props.avatar,
        emailVerified: props.emailVerified || false,
        workspaceId: props.workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id
    );
  }
}
