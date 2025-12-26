import { ValueObject } from "../../../../core/domain/ValueObject";
import { Result } from "../../../../core/domain/Result";

interface PasswordProps {
  value: string;
  hashed: boolean;
}

export class Password extends ValueObject<PasswordProps> {
  get value(): string {
    return this.props.value;
  }

  get isHashed(): boolean {
    return this.props.hashed;
  }

  private constructor(props: PasswordProps) {
    super(props);
  }

  private static meetsRequirements(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return (
      password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber
    );
  }

  public static create(password: string): Result<Password> {
    if (!password || password.length === 0) {
      return Result.fail<Password>("Password is required");
    }

    if (!this.meetsRequirements(password)) {
      return Result.fail<Password>(
        "Password must be at least 8 characters and contain uppercase, lowercase, and number"
      );
    }

    return Result.ok(new Password({ value: password, hashed: false }));
  }

  public static createHashed(hashedPassword: string): Result<Password> {
    if (!hashedPassword || hashedPassword.length === 0) {
      return Result.fail<Password>("Hashed password is required");
    }

    return Result.ok(new Password({ value: hashedPassword, hashed: true }));
  }
}
