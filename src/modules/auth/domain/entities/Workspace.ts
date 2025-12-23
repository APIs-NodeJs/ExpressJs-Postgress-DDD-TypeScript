import { AggregateRoot } from "@shared/domain/AggregateRoot";
import { v4 as uuidv4 } from "uuid";

interface WorkspaceProps {
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Workspace extends AggregateRoot<WorkspaceProps> {
  private constructor(props: WorkspaceProps, id?: string) {
    super(props, id);
  }

  protected generateId(): string {
    return uuidv4();
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  public static create(
    props: {
      name: string;
      ownerId: string;
      slug?: string;
    },
    id?: string
  ): Workspace {
    const slug = props.slug || this.generateSlug(props.name);

    return new Workspace(
      {
        name: props.name,
        slug,
        ownerId: props.ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id
    );
  }
}
