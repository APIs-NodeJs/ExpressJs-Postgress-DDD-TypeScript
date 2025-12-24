import { v4 as uuidv4 } from 'uuid';
import { Role } from '../../../../config/constants';

export interface UserProps {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  workspaceId: string;
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly password: string;
  public readonly name: string;
  public readonly role: Role;
  public readonly workspaceId: string;

  private constructor(props: UserProps) {
    this.id = props.id || uuidv4();
    this.email = props.email;
    this.password = props.password;
    this.name = props.name;
    this.role = props.role;
    this.workspaceId = props.workspaceId;
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
      workspaceId: this.workspaceId,
    };
  }
}
