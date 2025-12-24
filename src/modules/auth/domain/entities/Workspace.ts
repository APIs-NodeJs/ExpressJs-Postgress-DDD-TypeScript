import { v4 as uuidv4 } from 'uuid';

export interface WorkspaceProps {
  id?: string;
  name: string;
  ownerId: string;
}

export class Workspace {
  public readonly id: string;
  public readonly name: string;
  public readonly ownerId: string;

  private constructor(props: WorkspaceProps) {
    this.id = props.id || uuidv4();
    this.name = props.name;
    this.ownerId = props.ownerId;
  }

  public static create(props: WorkspaceProps): Workspace {
    return new Workspace(props);
  }
}
