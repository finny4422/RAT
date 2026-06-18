export class ReportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportValidationError';
  }
}

export class ReportNotFoundError extends Error {
  constructor(id: string) {
    super(`Report not found: ${id}`);
    this.name = 'ReportNotFoundError';
  }
}

export class ReportNotReadyError extends Error {
  constructor(activityId: string, requiredLogs: number, availableLogs: number) {
    super(
      `Report not ready for activity ${activityId}. Required ${requiredLogs} logs, found ${availableLogs}.`,
    );
    this.name = 'ReportNotReadyError';
  }
}
