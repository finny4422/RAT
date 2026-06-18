import type { Activity, CreateActivityInput, UpdateActivityInput } from '@/types';
import type { ActivityStatus } from '@/types';

import {
  calculateStatus,
  isActivityVisible,
  sortActivities,
  toDateString,
} from '@/utils';

import { ActivityNotFoundError } from './activityErrors';
import { mapRowToActivity } from './activityMapper';
import * as repository from './activityRepository';
import { validateActivityInput, validateActivityUpdate } from './activityValidator';

export type VisibleActivity = {
  activity: Activity;
  status: ActivityStatus;
};

export interface ActivityService {
  validateActivityInput(input: CreateActivityInput): void;
  createActivity(input: CreateActivityInput): Promise<Activity>;
  updateActivity(id: string, input: UpdateActivityInput): Promise<Activity>;
  deleteActivity(id: string): Promise<void>;
  getActivityById(id: string): Promise<Activity | null>;
  getTodaysVisibleActivities(currentTime?: Date): Promise<VisibleActivity[]>;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function buildVisibilityContext(dateString: string) {
  const [logsForToday, completionLogActivityIds] = await Promise.all([
    repository.selectActivityIdsWithLogOnDate(dateString),
    repository.selectActivityIdsWithCompletionLog(),
  ]);

  return {
    logsForToday,
    completionLogActivityIds,
  };
}

async function resolveVisibleActivities(currentTime: Date): Promise<VisibleActivity[]> {
  const dateString = toDateString(currentTime);
  const [rows, context] = await Promise.all([
    repository.selectAllActivities(),
    buildVisibilityContext(dateString),
  ]);

  const visible = rows
    .map(mapRowToActivity)
    .filter((activity) =>
      isActivityVisible(activity, currentTime, {
        hasLogForToday: context.logsForToday.has(activity.id),
        hasCompletionLog: context.completionLogActivityIds.has(activity.id),
      }),
    );

  const sorted = sortActivities(visible, currentTime);

  return sorted.map((activity) => ({
    activity,
    status: calculateStatus(activity, currentTime),
  }));
}

export const activityService: ActivityService = {
  /**
   * Input: CreateActivityInput
   * Output: void (throws ActivityValidationError)
   * Validation: title, caption, dueTime, warningMinutes, frequency-specific schedule fields
   */
  validateActivityInput(input: CreateActivityInput): void {
    validateActivityInput(input);
  },

  /**
   * Input: CreateActivityInput
   * Output: persisted Activity
   * Validation: validateActivityInput
   * Query: INSERT INTO activities … ; SELECT by id
   */
  async createActivity(input: CreateActivityInput): Promise<Activity> {
    validateActivityInput(input);

    const timestamp = nowIso();
    const row = await repository.insertActivity(generateId(), input, {
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return mapRowToActivity(row);
  },

  /**
   * Input: activity id, partial UpdateActivityInput
   * Output: updated Activity
   * Validation: merge with existing record, then validateActivityInput
   * Query: SELECT by id; UPDATE activities … ; SELECT by id
   */
  async updateActivity(id: string, input: UpdateActivityInput): Promise<Activity> {
    const existingRow = await repository.selectActivityById(id);

    if (!existingRow) {
      throw new ActivityNotFoundError(id);
    }

    const existing = mapRowToActivity(existingRow);
    validateActivityUpdate(existing, input);

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

    const updatedRow = await repository.updateActivityRow(id, merged, nowIso());

    if (!updatedRow) {
      throw new ActivityNotFoundError(id);
    }

    return mapRowToActivity(updatedRow);
  },

  /**
   * Input: activity id
   * Output: void
   * Validation: activity must exist
   * Query: DELETE FROM activities WHERE id = ? (cascades logs and reports)
   */
  async deleteActivity(id: string): Promise<void> {
    const existing = await repository.selectActivityById(id);

    if (!existing) {
      throw new ActivityNotFoundError(id);
    }

    await repository.deleteActivityById(id);
  },

  /**
   * Input: activity id
   * Output: Activity or null
   * Validation: none
   * Query: SELECT … FROM activities WHERE id = ?
   */
  async getActivityById(id: string): Promise<Activity | null> {
    const row = await repository.selectActivityById(id);
    return row ? mapRowToActivity(row) : null;
  },

  /**
   * Input: optional currentTime (defaults to now)
   * Output: visible activities with live card status, sorted Missed → Due Soon → Pending
   * Validation: none (read-only)
   * Queries:
   *   SELECT all activities
   *   SELECT activity_ids with log on today's date
   *   SELECT activity_ids with ON_TIME/LATE completion logs
   * Filters via isActivityVisible + sortActivities + calculateStatus
   */
  async getTodaysVisibleActivities(currentTime: Date = new Date()): Promise<VisibleActivity[]> {
    return resolveVisibleActivities(currentTime);
  },
};
