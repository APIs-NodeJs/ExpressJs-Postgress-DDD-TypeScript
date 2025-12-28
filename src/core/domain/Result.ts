export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error?: string;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, error?: string, value?: T) {
    if (isSuccess && error) {
      throw new Error('Invalid Result: Success cannot have an error');
    }
    if (!isSuccess && !error) {
      throw new Error('Invalid Result: Failure must have an error message');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Cannot get value from failed result. Error: ${this.error}`);
    }
    return this._value as T;
  }

  public getErrorValue(): string {
    if (this.isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this.error!;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  public static combine(results: Result<any>[]): Result<any> {
    for (const result of results) {
      if (result.isFailure) return result;
    }
    return Result.ok();
  }
}
