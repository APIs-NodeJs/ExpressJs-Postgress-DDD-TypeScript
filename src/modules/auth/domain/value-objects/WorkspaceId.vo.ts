import { ValueObject } from "../../../../core/domain/ValueObject";
import { Result } from "../../../../core/domain/Result";
import { v4 as uuidv4 } from "uuid";

interface WorkspaceIdProps {
  value: string;
}

export class WorkspaceId extends ValueObject<WorkspaceIdProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: WorkspaceIdProps) {
    super(props);
  }

  public static create(id?: string): Result<WorkspaceId> {
    const value = id || uuidv4();
    return Result.ok(new WorkspaceId({ value }));
  }
}
