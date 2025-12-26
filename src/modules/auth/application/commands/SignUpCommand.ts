import { Command } from "../../../../core/application/Command";

export class SignUpCommand implements Command {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName?: string,
    public readonly lastName?: string
  ) {}
}
