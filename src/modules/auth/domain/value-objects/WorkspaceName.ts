export class WorkspaceName {
  private readonly _value: string;

  private constructor(name: string) {
    this._value = name;
  }

  static create(name: string): WorkspaceName {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      throw new Error("Workspace name must be at least 2 characters");
    }

    if (trimmed.length > 100) {
      throw new Error("Workspace name must not exceed 100 characters");
    }

    if (!/^[a-zA-Z0-9\s-_]+$/.test(trimmed)) {
      throw new Error(
        "Workspace name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
    }

    return new WorkspaceName(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: WorkspaceName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
