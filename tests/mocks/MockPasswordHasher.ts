import { IPasswordHasher } from "../../src/modules/auth/domain/services/IPasswordHasher";

export class MockPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed_${password}`;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return hash === `hashed_${password}`;
  }
}
