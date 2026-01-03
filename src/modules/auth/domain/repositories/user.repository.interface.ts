// src/modules/auth/domain/repositories/user.repository.interface.ts

import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.value-object';

export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  existsByEmail(email: Email): Promise<boolean>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(limit?: number, offset?: number): Promise<User[]>;
  count(): Promise<number>;
}
