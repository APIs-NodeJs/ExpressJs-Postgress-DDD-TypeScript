import { ValueObject } from '../../../core/domain/ValueObject';
import { Result } from '../../../core/domain/Result';

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
    return emailRegex.test(email);
  }

  public static create(email: string): Result<Email> {
    if (!email || email.trim().length === 0) {
      return Result.fail<Email>('Email cannot be empty');
    }

    if (!this.isValidEmail(email)) {
      return Result.fail<Email>('Invalid email format');
    }

    if (email.length > 255) {
      return Result.fail<Email>('Email is too long');
    }

    return Result.ok<Email>(new Email({ value: email.toLowerCase().trim() }));
  }
}