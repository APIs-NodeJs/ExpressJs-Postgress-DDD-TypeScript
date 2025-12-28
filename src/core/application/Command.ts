import { Result } from '../domain/Result';

export interface ICommand {}

export interface ICommandHandler<TCommand extends ICommand, TResponse> {
  execute(command: TCommand): Promise<Result<TResponse>>;
}
