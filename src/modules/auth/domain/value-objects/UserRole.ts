import { ValueObject } from "@shared/domain/ValueObject";
import { Result } from "@shared/application/Result";

export type UserRoleType = "owner" | "admin" | "member" | "viewer";
export type AppRoleType =
  | "business_owner"
  | "product_owner"
  | "technical_leader"
  | "ui_ux_designer"
  | "frontend_dev"
  | "backend_dev"
  | "mobile_android"
  | "mobile_ios"
  | "qa_tester"
  | "project_manager";

interface UserRoleProps {
  value: UserRoleType;
}

export class UserRole extends ValueObject<UserRoleProps> {
  private constructor(props: UserRoleProps) {
    super(props);
  }

  get value(): UserRoleType {
    return this.props.value;
  }

  private static validRoles: UserRoleType[] = [
    "owner",
    "admin",
    "member",
    "viewer",
  ];

  public static create(role: string): Result<UserRole> {
    if (!this.validRoles.includes(role as UserRoleType)) {
      return Result.fail<UserRole>("Invalid user role");
    }

    return Result.ok<UserRole>(new UserRole({ value: role as UserRoleType }));
  }
}
