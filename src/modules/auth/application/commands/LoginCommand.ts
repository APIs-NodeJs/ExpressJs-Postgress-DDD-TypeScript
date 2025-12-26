import { Command } from "../../../../core/application/Command";

export class LoginCommand implements Command {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly ipAddress?: string
  ) {}
}
