// src/modules/users/domain/repositories/IUserRepository.ts
import { IRepository } from '../../../../core/application/ports/IRepository';
import { User } from '../entities/User';
import { Email } from '../valueObjects/Email';

export interface IUserRepository extends IRepository<User, string> {
  findByEmail(email: Email): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
}
