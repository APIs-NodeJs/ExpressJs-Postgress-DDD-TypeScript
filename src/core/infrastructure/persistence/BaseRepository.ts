// src/core/infrastructure/persistence/BaseRepository.ts
import { IRepository } from '../../application/ports/IRepository';
import { SequelizeUnitOfWork } from './SequelizeUnitOfWork';

/**
 * Base repository implementation for Sequelize
 *
 * @template TEntity - Domain entity type
 * @template TModel - Sequelize model type
 * @template TId - Entity identifier type (default: string)
 */
export abstract class BaseRepository<
  TEntity,
  TModel,
  TId = string,
> implements IRepository<TEntity, TId> {
  constructor(protected readonly unitOfWork: SequelizeUnitOfWork) {}

  /**
   * Get the current transaction if active, otherwise undefined
   */
  protected getTransaction() {
    return this.unitOfWork.isActive() ? this.unitOfWork.getTransaction() : undefined;
  }

  // Abstract methods that must be implemented by derived classes
  abstract findById(id: TId): Promise<TEntity | null>;
  abstract save(entity: TEntity): Promise<void>;
  abstract delete(id: TId): Promise<void>;
  abstract exists(id: TId): Promise<boolean>;

  // Mapping methods
  protected abstract toDomain(model: TModel): TEntity;
  protected abstract toPersistence(entity: TEntity): Partial<TModel>;
}
