// src/modules/user/domain/repositories/user-query.repository.interface.ts

import { User } from '@modules/auth/domain/entities/user.entity';
import { PaginationDto } from '@core/dtos';

export interface UserSearchCriteria {
  search?: string;
  status?: string;
  emailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface IUserQueryRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(pagination: PaginationDto): Promise<{ users: User[]; total: number }>;
  search(
    criteria: UserSearchCriteria,
    pagination: PaginationDto
  ): Promise<{ users: User[]; total: number }>;
  count(criteria?: UserSearchCriteria): Promise<number>;
  existsById(id: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
}
