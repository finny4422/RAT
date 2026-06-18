export class DatabaseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

export class MigrationError extends DatabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'MigrationError';
  }
}
