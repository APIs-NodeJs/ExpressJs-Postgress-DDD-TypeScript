// src/modules/workspaces/domain/repositories/IWorkspaceRepository.ts
import { IRepository } from '../../../../core/application/ports/IRepository';
import { Workspace } from '../entities/Workspace';
import { PaginatedResult } from '../../../../shared/types/PaginationTypes';
import { QueryOptions } from '../../../../core/infrastructure/persistence/QueryBuilder';

export interface IWorkspaceRepository extends IRepository<Workspace, string> {
  findBySlug(slug: string): Promise<Workspace | null>;
  findByOwnerId(ownerId: string): Promise<Workspace[]>;
  findByMemberId(userId: string): Promise<Workspace[]>;
  search(options: QueryOptions): Promise<PaginatedResult<Workspace>>;
}
