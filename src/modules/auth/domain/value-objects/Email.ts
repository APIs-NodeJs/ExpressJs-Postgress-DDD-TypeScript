import { ValueObject } from "@shared/domain/ValueObject";
import { Result } from "@shared/application/Result";

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  public static create(email: string): Result<Email> {
    if (!email || email.trim().length === 0) {
      return Result.fail<Email>("Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!this.isValidEmail(normalizedEmail)) {
      return Result.fail<Email>("Invalid email format");
    }

    return Result.ok<Email>(new Email({ value: normalizedEmail }));
  }
}
