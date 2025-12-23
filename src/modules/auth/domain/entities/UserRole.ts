import { AggregateRoot } from "@shared/domain/AggregateRoot";
import { AppRole, AppRoleType } from "../value-objects/AppRole";
import { v4 as uuidv4 } from "uuid";

interface UserRoleProps {
  userId: string;
  role: AppRole;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRole extends AggregateRoot<UserRoleProps> {
  private constructor(props: UserRoleProps, id?: string) {
    super(props, id);
  }

  protected generateId(): string {
    return uuidv4();
  }

  get userId(): string {
    return this.props.userId;
  }

  get role(): AppRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateRole(newRole: AppRole): void {
    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }

  public static create(
    props: {
      userId: string;
      role: AppRole;
    },
    id?: string
  ): UserRole {
    return new UserRole(
      {
        userId: props.userId,
        role: props.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id
    );
  }
}
