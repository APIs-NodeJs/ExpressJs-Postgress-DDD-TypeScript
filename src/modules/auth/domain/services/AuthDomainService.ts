import { User } from "../entities/User";
import { Password } from "../value-objects/Password";
import { Result } from "@shared/application/Result";

export class AuthDomainService {
  public static canChangePassword(user: User, oldPassword: string): boolean {
    // Domain logic for password change authorization
    return user.emailVerified;
  }

  public static validatePasswordStrength(password: string): Result<void> {
    if (password.length < 8) {
      return Result.fail("Password must be at least 8 characters");
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return Result.fail(
        "Password must contain uppercase, lowercase, and number"
      );
    }

    return Result.ok();
  }
}
