export class UserName {
  private readonly _value: string;

  private constructor(name: string) {
    this._value = name;
  }

  static create(name: string): UserName {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      throw new Error("Name must be at least 2 characters");
    }

    if (trimmed.length > 100) {
      throw new Error("Name must not exceed 100 characters");
    }

    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
      throw new Error(
        "Name can only contain letters, spaces, hyphens, and apostrophes"
      );
    }

    return new UserName(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
