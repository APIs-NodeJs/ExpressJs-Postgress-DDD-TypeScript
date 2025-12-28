export abstract class Entity<TId> {
  protected readonly _id: TId;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: TId, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): TId {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  public equals(entity?: Entity<TId>): boolean {
    if (!entity) return false;
    if (this === entity) return true;
    return this._id === entity._id;
  }
}
