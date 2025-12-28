// src/modules/workspaces/domain/repositories/IWorkspaceRepository.ts
import { IRepository } from '../../../../core/application/ports/IRepository';
import { Workspace } from '../entities/Workspace';

export interface IWorkspaceRepository extends IRepository<Workspace, string> {
  findBySlug(slug: string): Promise<Workspace | null>;
  findByOwnerId(ownerId: string): Promise<Workspace[]>;
  findByMemberId(userId: string): Promise<Workspace[]>;
}
