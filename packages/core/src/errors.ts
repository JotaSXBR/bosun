export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class AuthorizationError extends DomainError {
  constructor(message = "You do not have permission to perform this action") {
    super("AUTHORIZATION_ERROR", message);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super("NOT_FOUND", id ? `${resource} "${id}" was not found` : `${resource} was not found`);
  }
}
