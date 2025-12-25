import { v4 as uuidv4 } from "uuid";

export class SessionId {
  private readonly _value: string;

  private constructor(id: string) {
    this._value = id;
  }

  static create(): SessionId {
    return new SessionId(uuidv4());
  }

  static fromString(id: string): SessionId {
    if (!this.isValid(id)) {
      throw new Error("Invalid session ID format");
    }
    return new SessionId(id);
  }

  private static isValid(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  get value(): string {
    return this._value;
  }

  equals(other: SessionId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
