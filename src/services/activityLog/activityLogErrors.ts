export class ActivityLogNotFoundError extends Error {
  constructor(id: string) {
    super(`Activity log not found: ${id}`);
    this.name = 'ActivityLogNotFoundError';
  }
}

export class DuplicateActivityLogError extends Error {
  constructor(activityId: string, date: string) {
    super(`Activity log already exists for activity ${activityId} on ${date}.`);
    this.name = 'DuplicateActivityLogError';
  }
}

export class ActivityLogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActivityLogValidationError';
  }
}

export class CompletionNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompletionNotAllowedError';
  }
}
