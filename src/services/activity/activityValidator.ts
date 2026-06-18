import type { Activity, CreateActivityInput } from '@/types';
import { ActivityFrequency } from '@/types';

import { ACTIVITY_FREQUENCIES } from '@/database/schema';

import { ActivityValidationError } from './activityErrors';

const DUE_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function validateFrequencyFields(activity: CreateActivityInput, errors: Record<string, string>): void {
  switch (activity.frequency) {
    case ActivityFrequency.Daily:
      if (activity.weekDay !== null) {
        errors.weekDay = 'weekDay must be null for daily activities.';
      }
      if (activity.monthDay !== null) {
        errors.monthDay = 'monthDay must be null for daily activities.';
      }
      if (activity.oneTimeDate !== null) {
        errors.oneTimeDate = 'oneTimeDate must be null for daily activities.';
      }
      break;

    case ActivityFrequency.Weekly:
      if (activity.weekDay === null || activity.weekDay < 0 || activity.weekDay > 6) {
        errors.weekDay = 'weekDay must be between 0 (Sunday) and 6 (Saturday).';
      }
      if (activity.monthDay !== null) {
        errors.monthDay = 'monthDay must be null for weekly activities.';
      }
      if (activity.oneTimeDate !== null) {
        errors.oneTimeDate = 'oneTimeDate must be null for weekly activities.';
      }
      break;

    case ActivityFrequency.Monthly:
      if (activity.monthDay === null || activity.monthDay < 1 || activity.monthDay > 31) {
        errors.monthDay = 'monthDay must be between 1 and 31.';
      }
      if (activity.weekDay !== null) {
        errors.weekDay = 'weekDay must be null for monthly activities.';
      }
      if (activity.oneTimeDate !== null) {
        errors.oneTimeDate = 'oneTimeDate must be null for monthly activities.';
      }
      break;

    case ActivityFrequency.OneTime:
      if (!activity.oneTimeDate || !isValidDateString(activity.oneTimeDate)) {
        errors.oneTimeDate = 'oneTimeDate must be a valid YYYY-MM-DD date.';
      }
      if (activity.weekDay !== null) {
        errors.weekDay = 'weekDay must be null for one-time activities.';
      }
      if (activity.monthDay !== null) {
        errors.monthDay = 'monthDay must be null for one-time activities.';
      }
      break;

    default:
      errors.frequency = `frequency must be one of: ${ACTIVITY_FREQUENCIES.join(', ')}.`;
  }
}

/**
 * Validates activity input for create and full-record updates.
 *
 * @throws ActivityValidationError
 */
export function validateActivityInput(input: CreateActivityInput): void {
  const errors: Record<string, string> = {};

  if (!input.title || input.title.trim().length === 0) {
    errors.title = 'title is required.';
  }

  if (input.caption === undefined || input.caption === null) {
    errors.caption = 'caption is required.';
  }

  if (!ACTIVITY_FREQUENCIES.includes(input.frequency)) {
    errors.frequency = `frequency must be one of: ${ACTIVITY_FREQUENCIES.join(', ')}.`;
  }

  if (!input.dueTime || !DUE_TIME_PATTERN.test(input.dueTime)) {
    errors.dueTime = 'dueTime must be in HH:MM 24-hour format.';
  }

  if (input.warningMinutes === undefined || input.warningMinutes < 0) {
    errors.warningMinutes = 'warningMinutes must be 0 or greater.';
  }

  if (input.active === undefined) {
    errors.active = 'active is required.';
  }

  validateFrequencyFields(input, errors);

  if (Object.keys(errors).length > 0) {
    throw new ActivityValidationError(errors);
  }
}

/**
 * Validates a partial update by merging with the existing activity first.
 *
 * @throws ActivityValidationError
 */
export function validateActivityUpdate(existing: Activity, input: Partial<CreateActivityInput>): void {
  const merged: CreateActivityInput = {
    title: input.title ?? existing.title,
    caption: input.caption ?? existing.caption,
    frequency: input.frequency ?? existing.frequency,
    dueTime: input.dueTime ?? existing.dueTime,
    warningMinutes: input.warningMinutes ?? existing.warningMinutes,
    weekDay: input.weekDay !== undefined ? input.weekDay : existing.weekDay,
    monthDay: input.monthDay !== undefined ? input.monthDay : existing.monthDay,
    oneTimeDate: input.oneTimeDate !== undefined ? input.oneTimeDate : existing.oneTimeDate,
    active: input.active ?? existing.active,
  };

  validateActivityInput(merged);
}
