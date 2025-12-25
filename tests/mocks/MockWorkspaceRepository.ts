import { Workspace } from "../../src/modules/auth/domain/entities/Workspace";
import { IWorkspaceRepository } from "../../src/modules/auth/domain/repositories/IWorkspaceRepository";

export class MockWorkspaceRepository implements IWorkspaceRepository {
  private workspaces: Map<string, Workspace> = new Map();

  async findById(id: string): Promise<Workspace | null> {
    return this.workspaces.get(id) || null;
  }

  async create(workspace: Workspace): Promise<Workspace> {
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  async updateOwner(workspaceId: string, ownerId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId);
    if (workspace) {
      const updated = Workspace.create({
        ...workspace,
        ownerId,
      });
      this.workspaces.set(workspaceId, updated);
    }
  }

  async update(
    id: string,
    updates: Partial<Workspace>
  ): Promise<Workspace | null> {
    const workspace = this.workspaces.get(id);
    if (!workspace) return null;

    const updated = Workspace.create({
      ...workspace,
      ...updates,
    });
    this.workspaces.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.workspaces.delete(id);
  }

  // Test helpers
  clear(): void {
    this.workspaces.clear();
  }

  getAll(): Workspace[] {
    return Array.from(this.workspaces.values());
  }
}
