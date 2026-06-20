import { ACTIVITIES_COLUMNS } from '@/database/schema';
import type { Activity } from '@/types';
import { ActivityFrequency, ActivityStatus } from '@/types';

import type { VisibleActivity } from './activityService';

function readField(record: Record<string, unknown>, camelKey: string, columnKey: string): unknown {
  if (record[camelKey] !== undefined && record[camelKey] !== null) {
    return record[camelKey];
  }

  return record[columnKey];
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function asNullableInt(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function asBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 1) {
    return true;
  }

  if (value === 0) {
    return false;
  }

  return fallback;
}

function normalizeFrequency(value: unknown): ActivityFrequency {
  if (
    value === ActivityFrequency.Daily ||
    value === ActivityFrequency.Weekly ||
    value === ActivityFrequency.Monthly ||
    value === ActivityFrequency.OneTime
  ) {
    return value;
  }

  return ActivityFrequency.Daily;
}

function asNullableDateString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = asString(value);
  return text.length > 0 ? text : null;
}

export function normalizeActivityStatus(status: unknown): ActivityStatus {
  if (
    status === ActivityStatus.Pending ||
    status === ActivityStatus.DueSoon ||
    status === ActivityStatus.Missed
  ) {
    return status;
  }

  return ActivityStatus.Pending;
}

const EMPTY_ACTIVITY: Activity = {
  id: '',
  title: 'Untitled activity',
  caption: '',
  frequency: ActivityFrequency.Daily,
  dueTime: '00:00',
  warningMinutes: 0,
  weekDay: null,
  monthDay: null,
  oneTimeDate: null,
  active: true,
  createdAt: '',
  updatedAt: '',
  lastClosedDate: null,
};

/**
 * Normalizes legacy or partial activity records so UI layers never crash on missing fields.
 */
export function normalizeActivity(raw: unknown): Activity {
  if (!raw || typeof raw !== 'object') {
    if (__DEV__) {
      console.warn('[normalizeActivity] received non-object activity payload');
    }

    return { ...EMPTY_ACTIVITY };
  }

  const record = raw as Record<string, unknown>;
  const title = asString(readField(record, 'title', ACTIVITIES_COLUMNS.title));

  if (__DEV__ && title.trim().length === 0) {
    console.warn('[normalizeActivity] activity missing title', {
      id: asString(readField(record, 'id', ACTIVITIES_COLUMNS.id)),
    });
  }

  return {
    id: asString(readField(record, 'id', ACTIVITIES_COLUMNS.id)),
    title: title.trim().length > 0 ? title : 'Untitled activity',
    caption: asString(readField(record, 'caption', ACTIVITIES_COLUMNS.caption)),
    frequency: normalizeFrequency(readField(record, 'frequency', ACTIVITIES_COLUMNS.frequency)),
    dueTime: asString(readField(record, 'dueTime', ACTIVITIES_COLUMNS.dueTime), '00:00'),
    warningMinutes: asNumber(
      readField(record, 'warningMinutes', ACTIVITIES_COLUMNS.warningMinutes),
    ),
    weekDay: asNullableInt(readField(record, 'weekDay', ACTIVITIES_COLUMNS.weekDay)),
    monthDay: asNullableInt(readField(record, 'monthDay', ACTIVITIES_COLUMNS.monthDay)),
    oneTimeDate: asNullableDateString(
      readField(record, 'oneTimeDate', ACTIVITIES_COLUMNS.oneTimeDate),
    ),
    active: asBoolean(readField(record, 'active', ACTIVITIES_COLUMNS.active)),
    createdAt: asString(readField(record, 'createdAt', ACTIVITIES_COLUMNS.createdAt)),
    updatedAt: asString(readField(record, 'updatedAt', ACTIVITIES_COLUMNS.updatedAt)),
    lastClosedDate: asNullableDateString(
      readField(record, 'lastClosedDate', ACTIVITIES_COLUMNS.lastClosedDate),
    ),
  };
}

export function normalizeVisibleActivity(raw: unknown): VisibleActivity {
  if (!raw || typeof raw !== 'object') {
    return {
      activity: normalizeActivity(raw),
      status: ActivityStatus.Pending,
    };
  }

  const item = raw as { activity?: unknown; status?: unknown };

  return {
    activity: normalizeActivity(item.activity),
    status: normalizeActivityStatus(item.status),
  };
}
