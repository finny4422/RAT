export class ActivityValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super('Activity validation failed.');
    this.name = 'ActivityValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class ActivityNotFoundError extends Error {
  constructor(id: string) {
    super(`Activity not found: ${id}`);
    this.name = 'ActivityNotFoundError';
  }
}
