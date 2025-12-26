import { Workspace } from "../aggregates/Workspace.aggregate";
import { Repository } from "../../../../core/infrastructure/persistence/Repository";

export interface IWorkspaceRepository extends Repository<Workspace> {
  findByOwnerId(ownerId: string): Promise<Workspace[]>;
  existsByName(name: string): Promise<boolean>;
}
