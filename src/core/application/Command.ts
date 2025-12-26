import { Result } from "../domain/Result";

export interface Command {}

export interface CommandHandler<TCommand extends Command, TResponse> {
  execute(command: TCommand): Promise<Result<TResponse>>;
}
