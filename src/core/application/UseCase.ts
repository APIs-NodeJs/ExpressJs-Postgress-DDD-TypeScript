import { Result } from '../domain/Result';

export interface IUseCase<IRequest, IResponse> {
  execute(request: IRequest): Promise<Result<IResponse>>;
}
