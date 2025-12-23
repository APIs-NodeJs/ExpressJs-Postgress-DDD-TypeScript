import * as bcrypt from "bcrypt";
import { config } from "@config/env";

export class PasswordHasher {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, config.security.bcryptRounds);
  }

  static async compare(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
