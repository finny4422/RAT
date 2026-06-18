/**
 * Formats a Date as `YYYY-MM-DD` using the local calendar date.
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns the local calendar date (`YYYY-MM-DD`) from an ISO 8601 timestamp. */
export function toDateStringFromIso(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}

/**
 * Returns true when two Date values fall on the same local calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Parses a `YYYY-MM-DD` string into a local Date at midnight. */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Adds calendar days to a `YYYY-MM-DD` string and returns a new date string. */
export function addDaysToDateString(dateString: string, days: number): string {
  const date = parseDateString(dateString);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

/**
 * Combines a 24-hour `HH:MM` time string with a calendar date.
 *
 * @param time - Time in `HH:MM` format (e.g. `"20:00"`)
 * @param date - Calendar date; hours/minutes/seconds are replaced
 */
export function parseTimeOnDate(time: string, date: Date): Date {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());

  if (!match) {
    throw new Error(`Invalid time format "${time}". Expected HH:MM.`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid time value "${time}".`);
  }

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
