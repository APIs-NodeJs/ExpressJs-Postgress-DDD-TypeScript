import { SignUpCommand } from "../commands/SignUpCommand";
import { LoginCommand } from "../commands/LoginCommand";
import { GetUserQuery } from "../queries/GetUserQuery";
import { SignUpHandler } from "../commands/handlers/SignUpHandler";
import { LoginHandler } from "../commands/handlers/LoginHandler";
import { GetUserHandler } from "../queries/handlers/GetUserHandler";

export class AuthApplicationService {
  constructor(
    private readonly signUpHandler: SignUpHandler,
    private readonly loginHandler: LoginHandler,
    private readonly getUserHandler: GetUserHandler
  ) {}

  async signUp(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) {
    const command = new SignUpCommand(email, password, firstName, lastName);
    return await this.signUpHandler.execute(command);
  }

  async login(email: string, password: string, ipAddress?: string) {
    const command = new LoginCommand(email, password, ipAddress);
    return await this.loginHandler.execute(command);
  }

  async getUser(userId: string) {
    const query = new GetUserQuery(userId);
    return await this.getUserHandler.execute(query);
  }
}
