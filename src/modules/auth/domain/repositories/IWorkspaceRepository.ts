import { Workspace } from "../entities/Workspace";

export interface IWorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  create(workspace: Workspace, transaction?: any): Promise<Workspace>;
  updateOwner(
    workspaceId: string,
    ownerId: string,
    transaction?: any
  ): Promise<void>;
  update(
    id: string,
    updates: Partial<Workspace>,
    transaction?: any
  ): Promise<Workspace | null>;
  delete(id: string, transaction?: any): Promise<boolean>;
}
