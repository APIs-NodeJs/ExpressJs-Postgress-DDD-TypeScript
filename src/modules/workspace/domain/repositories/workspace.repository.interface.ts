// src/modules/workspace/domain/repositories/workspace.repository.interface.ts

import { Workspace } from '../entities/workspace.entity';

export interface IWorkspaceRepository {
  save(workspace: Workspace): Promise<Workspace>;
  findById(id: string): Promise<Workspace | null>;
  findBySlug(slug: string): Promise<Workspace | null>;
  findByOwnerId(ownerId: string): Promise<Workspace[]>;
  existsBySlug(slug: string): Promise<boolean>;
  update(workspace: Workspace): Promise<Workspace>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
