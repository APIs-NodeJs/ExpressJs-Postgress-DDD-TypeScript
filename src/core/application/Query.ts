import { Result } from "../domain/Result";

export interface Query {}

export interface QueryHandler<TQuery extends Query, TResponse> {
  execute(query: TQuery): Promise<Result<TResponse>>;
}
