export class Email {
  private readonly _value: string;

  private constructor(email: string) {
    this._value = email;
  }

  static create(email: string): Email {
    const normalized = email.toLowerCase().trim();

    if (!this.isValid(normalized)) {
      throw new Error("Invalid email format");
    }

    return new Email(normalized);
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
