import { Result } from '../domain/Result';

export interface IQuery {}

export interface IQueryHandler<TQuery extends IQuery, TResponse> {
  execute(query: TQuery): Promise<Result<TResponse>>;
}
