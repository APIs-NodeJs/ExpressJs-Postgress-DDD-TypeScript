import { v4 as uuidv4 } from 'uuid';
import { Role } from '../../../config/constants';

export interface UserProps {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  emailVerified: boolean;
  workspaceId: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly password: string;
  public readonly name: string;
  public readonly role: Role;
  public readonly emailVerified: boolean;
  public readonly workspaceId: string;
  public readonly avatar?: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id || uuidv4();
    this.email = props.email;
    this.password = props.password;
    this.name = props.name;
    this.role = props.role;
    this.emailVerified = props.emailVerified;
    this.workspaceId = props.workspaceId;
    this.avatar = props.avatar;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public static create(props: UserProps): User {
    return new User(props);
  }

  public toDTO() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      emailVerified: this.emailVerified,
      workspaceId: this.workspaceId,
      avatar: this.avatar,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
