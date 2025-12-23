import { Workspace } from "../entities/Workspace";

export interface IWorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  findBySlug(slug: string): Promise<Workspace | null>;
  save(workspace: Workspace): Promise<Workspace>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}
