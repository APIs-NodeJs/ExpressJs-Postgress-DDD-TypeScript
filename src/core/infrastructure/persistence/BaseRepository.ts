// src/core/infrastructure/persistence/BaseRepository.ts
import { IRepository } from '../../application/ports/IRepository';
import { SequelizeUnitOfWork } from './SequelizeUnitOfWork';
import { AggregateRoot } from '../../domain/AggregateRoot';
import { transactionalEventBus } from '../outbox/TransactionalEventBus';

export abstract class BaseRepository<
  TEntity,
  TModel,
  TId = string,
> implements IRepository<TEntity, TId> {
  constructor(protected readonly unitOfWork: SequelizeUnitOfWork) {}

  protected getTransaction() {
    return this.unitOfWork.isActive() ? this.unitOfWork.getTransaction() : undefined;
  }

  /**
   * Save aggregate and its events to outbox in same transaction
   */
  protected async saveWithEvents(
    aggregate: AggregateRoot<TId>,
    aggregateType: string
  ): Promise<void> {
    const transaction = this.getTransaction();

    if (!transaction) {
      throw new Error('Cannot save with events outside of transaction');
    }

    // 1. Save the aggregate
    await this.save(aggregate);

    // 2. Save events to outbox (same transaction)
    if (aggregate.domainEvents.length > 0) {
      await transactionalEventBus.saveToOutbox(
        aggregate.domainEvents,
        aggregateType,
        transaction
      );

      // 3. Clear events after saving to outbox
      aggregate.clearEvents();
    }
  }

  abstract findById(id: TId): Promise<TEntity | null>;
  abstract save(entity: TEntity): Promise<void>;
  abstract delete(id: TId): Promise<void>;
  abstract exists(id: TId): Promise<boolean>;

  protected abstract toDomain(model: TModel): TEntity;
  protected abstract toPersistence(entity: TEntity): Partial<TModel>;
}
