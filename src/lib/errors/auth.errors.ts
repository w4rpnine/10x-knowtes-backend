export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class EmailAlreadyInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailAlreadyInUseError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
