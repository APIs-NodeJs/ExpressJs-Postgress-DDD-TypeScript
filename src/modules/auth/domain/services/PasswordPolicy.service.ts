import { Result } from "../../../../core/domain/Result";

export class PasswordPolicyService {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly COMMON_PASSWORDS = [
    "password",
    "12345678",
    "qwerty",
    "abc123",
    "password123",
  ];

  public static validate(password: string): Result<void> {
    if (password.length < this.MIN_LENGTH) {
      return Result.fail<void>(
        `Password must be at least ${this.MIN_LENGTH} characters`
      );
    }

    if (password.length > this.MAX_LENGTH) {
      return Result.fail<void>(
        `Password must not exceed ${this.MAX_LENGTH} characters`
      );
    }

    if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
      return Result.fail<void>("Password is too common");
    }

    if (!/[A-Z]/.test(password)) {
      return Result.fail<void>(
        "Password must contain at least one uppercase letter"
      );
    }

    if (!/[a-z]/.test(password)) {
      return Result.fail<void>(
        "Password must contain at least one lowercase letter"
      );
    }

    if (!/[0-9]/.test(password)) {
      return Result.fail<void>("Password must contain at least one number");
    }

    return Result.ok();
  }

  public static checkStrength(password: string): "weak" | "medium" | "strong" {
    let score = 0;

    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return "weak";
    if (score <= 3) return "medium";
    return "strong";
  }
}
