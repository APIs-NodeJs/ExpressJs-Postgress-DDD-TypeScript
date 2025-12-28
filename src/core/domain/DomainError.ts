export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`);
  }
}
