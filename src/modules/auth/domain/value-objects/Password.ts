export class Password {
  private readonly _hash: string;

  private constructor(hash: string) {
    this._hash = hash;
  }

  static createNew(plaintext: string): Password {
    this.validate(plaintext);
    // Note: This returns unvalidated Password for hashing by infrastructure
    return new Password(plaintext);
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  private static validate(password: string): void {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    if (password.length > 128) {
      errors.push("Password must not exceed 128 characters");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    if (/\s/.test(password)) {
      errors.push("Password must not contain whitespace");
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }

  get hash(): string {
    return this._hash;
  }
}
