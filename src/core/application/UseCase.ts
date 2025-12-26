import { Result } from "../domain/Result";

export interface UseCase<IRequest, IResponse> {
  execute(request: IRequest): Promise<Result<IResponse>>;
}
