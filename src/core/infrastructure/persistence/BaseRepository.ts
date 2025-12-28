import { IRepository } from '../../application/ports/IRepository';
import { SequelizeUnitOfWork } from './SequelizeUnitOfWork';

export abstract class BaseRepository<TEntity, TModel, TId = string>
  implements IRepository<TEntity, TId> {

  constructor(protected readonly unitOfWork: SequelizeUnitOfWork) {}

  protected getTransaction() {
    return this.unitOfWork.isActive()
      ? this.unitOfWork.getTransaction()
      : undefined;
  }

  abstract findById(id: TId): Promise<TEntity | null>;
  abstract save(entity: TEntity): Promise<void>;
  abstract delete(id: TId): Promise<void>;
  abstract exists(id: TId): Promise<boolean>;

  protected abstract toDomain(model: TModel): TEntity;
  protected abstract toPersistence(entity: TEntity): Partial<TModel>;
}
