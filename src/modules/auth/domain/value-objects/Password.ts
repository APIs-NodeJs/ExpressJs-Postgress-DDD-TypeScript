import { ValueObject } from "@shared/domain/ValueObject";
import { Result } from "@shared/application/Result";

interface PasswordProps {
  value: string;
  hashed: boolean;
}

export class Password extends ValueObject<PasswordProps> {
  private constructor(props: PasswordProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  get isHashed(): boolean {
    return this.props.hashed;
  }

  private static isValidPassword(password: string): boolean {
    if (password.length < 8) return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber;
  }

  public static create(password: string, hashed = false): Result<Password> {
    if (!password) {
      return Result.fail<Password>("Password is required");
    }

    if (!hashed && !this.isValidPassword(password)) {
      return Result.fail<Password>(
        "Password must be at least 8 characters and contain uppercase, lowercase, and number"
      );
    }

    return Result.ok<Password>(new Password({ value: password, hashed }));
  }

  public static createHashed(hashedPassword: string): Result<Password> {
    return this.create(hashedPassword, true);
  }
}
