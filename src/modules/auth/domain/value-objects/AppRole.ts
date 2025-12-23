import { ValueObject } from "@shared/domain/ValueObject";
import { Result } from "@shared/application/Result";

export type AppRoleType = "owner" | "admin" | "moderator" | "user";

interface AppRoleProps {
  value: AppRoleType;
}

export class AppRole extends ValueObject<AppRoleProps> {
  private constructor(props: AppRoleProps) {
    super(props);
  }

  get value(): AppRoleType {
    return this.props.value;
  }

  private static validRoles: AppRoleType[] = [
    "owner",
    "admin",
    "moderator",
    "user",
  ];

  public static create(role: string): Result<AppRole> {
    // Map legacy 'superAdmin' to 'owner'
    const normalizedRole = role === "superAdmin" ? "owner" : role;

    if (!this.validRoles.includes(normalizedRole as AppRoleType)) {
      return Result.fail<AppRole>("Invalid app role");
    }
    return Result.ok<AppRole>(
      new AppRole({ value: normalizedRole as AppRoleType })
    );
  }

  public isOwner(): boolean {
    return this.props.value === "owner";
  }

  public isAdmin(): boolean {
    return this.props.value === "admin" || this.props.value === "owner";
  }

  public isModerator(): boolean {
    return this.props.value === "moderator";
  }

  public isUser(): boolean {
    return this.props.value === "user";
  }

  public canManageUsers(): boolean {
    return this.isOwner() || this.props.value === "admin";
  }

  public canManageAdmins(): boolean {
    return this.isOwner();
  }

  public canManageBilling(): boolean {
    return this.isOwner() || this.props.value === "admin";
  }

  public canManageCORS(): boolean {
    return this.isOwner();
  }

  public canAccessAdminDashboard(): boolean {
    return this.isOwner() || this.props.value === "admin";
  }
}
