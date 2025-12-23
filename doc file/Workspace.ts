import { v4 as uuidv4 } from 'uuid';

export interface WorkspaceProps {
  id?: string;
  name: string;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Workspace {
  public readonly id: string;
  public readonly name: string;
  public readonly ownerId: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: WorkspaceProps) {
    this.id = props.id || uuidv4();
    this.name = props.name;
    this.ownerId = props.ownerId;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public static create(props: WorkspaceProps): Workspace {
    return new Workspace(props);
  }

  public toDTO() {
    return {
      id: this.id,
      name: this.name,
      ownerId: this.ownerId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
