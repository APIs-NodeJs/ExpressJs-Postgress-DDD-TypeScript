import { ValueObject } from "../../../../core/domain/ValueObject";
import { Result } from "../../../../core/domain/Result";
import { v4 as uuidv4 } from "uuid";

interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: UserIdProps) {
    super(props);
  }

  public static create(id?: string): Result<UserId> {
    const value = id || uuidv4();
    return Result.ok(new UserId({ value }));
  }
}
