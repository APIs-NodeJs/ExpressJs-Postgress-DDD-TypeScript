import { Result } from "../../core/domain/Result";

export interface SoftDeletable {
  deletedAt: Date | null;
  isDeleted: boolean;
  softDelete(): Result<void>;
  restore(): Result<void>;
}

/**
 * Mixin for soft delete functionality
 */
export abstract class SoftDeletableEntity {
  protected _deletedAt: Date | null = null;

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  /**
   * Soft delete the entity
   */
  public softDelete(): Result<void> {
    if (this.isDeleted) {
      return Result.fail<void>("Entity is already deleted");
    }

    this._deletedAt = new Date();
    return Result.ok();
  }

  /**
   * Restore soft deleted entity
   */
  public restore(): Result<void> {
    if (!this.isDeleted) {
      return Result.fail<void>("Entity is not deleted");
    }

    this._deletedAt = null;
    return Result.ok();
  }

  /**
   * Permanently delete (remove from database)
   */
  public hardDelete(): Result<void> {
    // This should trigger actual deletion from database
    return Result.ok();
  }
}
