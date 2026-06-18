import type { Activity, ActivityLog } from '@/types';
import { ActivityFrequency, ActivityResult } from '@/types';

import { activityService } from '@/services/activity/activityService';
import * as activityRepository from '@/services/activity/activityRepository';
import { mapRowToActivity } from '@/services/activity/activityMapper';
import { ActivityNotFoundError } from '@/services/activity/activityErrors';
import {
  addDaysToDateString,
  calculateCompletionResult,
  isScheduledForCycleDate,
  parseDateString,
  parseTimeOnDate,
  toDateString,
  toDateStringFromIso,
} from '@/utils';

import {
  ActivityLogValidationError,
  CompletionNotAllowedError,
  DuplicateActivityLogError,
} from './activityLogErrors';
import { mapRowToActivityLog } from './activityLogMapper';
import * as logRepository from './activityLogRepository';

export type CycleCloseResult = {
  missedLogsCreated: number;
  activitiesProcessed: number;
  throughDate: string;
};

export interface ActivityLogService {
  recordCompletion(activityId: string, completedAt?: Date): Promise<ActivityLog>;
  createMissedLog(activityId: string, cycleDate: Date): Promise<ActivityLog | null>;
  runCycleCloseBackfill(currentTime?: Date): Promise<CycleCloseResult>;
  getLogsByActivityId(activityId: string): Promise<ActivityLog[]>;
  getLogsByDateRange(activityId: string, startDate: string, endDate: string): Promise<ActivityLog[]>;
  getUnreportedLogs(
    activityId: string,
    frequency: ActivityFrequency,
    limit?: number,
  ): Promise<ActivityLog[]>;
  getLogByActivityAndDate(activityId: string, date: string): Promise<ActivityLog | null>;
  markLogsAsReported(logIds: string[], reportId: string): Promise<void>;
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

function getYesterdayDateString(currentTime: Date): string {
  const yesterday = new Date(currentTime);
  yesterday.setDate(yesterday.getDate() - 1);
  return toDateString(yesterday);
}

function resolveCycleDate(activity: Activity, completedAt: Date): string {
  if (activity.frequency === ActivityFrequency.OneTime) {
    if (!activity.oneTimeDate) {
      throw new ActivityLogValidationError('One-time activity is missing oneTimeDate.');
    }

    return activity.oneTimeDate;
  }

  return toDateString(completedAt);
}

function assertRecurringCompletionAllowed(
  activity: Activity,
  cycleDate: string,
  completedAt: Date,
): void {
  if (toDateString(completedAt) !== cycleDate) {
    throw new CompletionNotAllowedError(
      'Recurring activities can only be completed on their cycle date.',
    );
  }

  const nextMidnight = parseDateString(addDaysToDateString(cycleDate, 1));
  if (completedAt >= nextMidnight) {
    throw new CompletionNotAllowedError(
      'Recurring activities cannot be completed after local midnight on the cycle date.',
    );
  }
}

async function loadActivity(activityId: string): Promise<Activity> {
  const activity = await activityService.getActivityById(activityId);

  if (!activity) {
    throw new ActivityNotFoundError(activityId);
  }

  return activity;
}

export const activityLogService: ActivityLogService = {
  /**
   * Input: activityId, optional completedAt (defaults to now)
   * Output: ActivityLog with ON_TIME or LATE
   * Validation: activity exists; recurring rules; duplicate prevention
   * Queries: SELECT activity; SELECT log by cycle; INSERT or UPDATE log
   */
  async recordCompletion(activityId: string, completedAt: Date = new Date()): Promise<ActivityLog> {
    const activity = await loadActivity(activityId);
    const cycleDate = resolveCycleDate(activity, completedAt);
    const existing = await logRepository.selectLogByActivityAndDate(activityId, cycleDate);

    if (
      existing &&
      (existing.result === ActivityResult.OnTime || existing.result === ActivityResult.Late)
    ) {
      throw new DuplicateActivityLogError(activityId, cycleDate);
    }

    const dueAt = parseTimeOnDate(activity.dueTime, parseDateString(cycleDate));
    const result = calculateCompletionResult(completedAt, dueAt);
    const completedAtIso = completedAt.toISOString();

    if (activity.frequency === ActivityFrequency.OneTime) {
      if (existing?.result === ActivityResult.Missed) {
        const updated = await logRepository.updateLogCompletion(
          activityId,
          cycleDate,
          completedAtIso,
          result,
        );

        if (!updated) {
          throw new ActivityLogValidationError('Failed to update one-time MISSED log to LATE.');
        }

        await activityService.updateActivity(activityId, { active: false });
        return mapRowToActivityLog(updated);
      }

      const row = await logRepository.insertActivityLog(
        generateId(),
        {
          activityId,
          date: cycleDate,
          dueTime: activity.dueTime,
          frequency: activity.frequency,
          completedAt: completedAtIso,
          result,
        },
        nowIso(),
      );

      await activityService.updateActivity(activityId, { active: false });
      return mapRowToActivityLog(row);
    }

    assertRecurringCompletionAllowed(activity, cycleDate, completedAt);

    if (existing?.result === ActivityResult.Missed) {
      throw new CompletionNotAllowedError(
        'Recurring activity cycle has closed. Completion is no longer allowed.',
      );
    }

    const row = await logRepository.insertActivityLog(
      generateId(),
      {
        activityId,
        date: cycleDate,
        dueTime: activity.dueTime,
        frequency: activity.frequency,
        completedAt: completedAtIso,
        result,
      },
      nowIso(),
    );

    return mapRowToActivityLog(row);
  },

  /**
   * Input: activityId, cycleDate
   * Output: ActivityLog (MISSED) or null if skipped
   * Validation: scheduled + active + no existing log
   * Queries: SELECT activity; SELECT log; INSERT MISSED log
   */
  async createMissedLog(activityId: string, cycleDate: Date): Promise<ActivityLog | null> {
    const activity = await loadActivity(activityId);
    const cycleDateString = toDateString(cycleDate);

    if (!activity.active) {
      return null;
    }

    if (!isScheduledForCycleDate(activity, cycleDate)) {
      return null;
    }

    const existing = await logRepository.selectLogByActivityAndDate(activityId, cycleDateString);
    if (existing) {
      return null;
    }

    try {
      const row = await logRepository.insertActivityLog(
        generateId(),
        {
          activityId,
          date: cycleDateString,
          dueTime: activity.dueTime,
          frequency: activity.frequency,
          completedAt: null,
          result: ActivityResult.Missed,
        },
        nowIso(),
      );

      return mapRowToActivityLog(row);
    } catch (error) {
      if (error instanceof DuplicateActivityLogError) {
        return null;
      }

      throw error;
    }
  },

  /**
   * Input: optional currentTime (defaults to now)
   * Output: CycleCloseResult summary
   * Validation: processes through yesterday only
   * Queries: SELECT all activities; INSERT MISSED logs; UPDATE last_closed_date
   */
  async runCycleCloseBackfill(currentTime: Date = new Date()): Promise<CycleCloseResult> {
    const throughDate = getYesterdayDateString(currentTime);
    const rows = await activityRepository.selectAllActivities();

    let missedLogsCreated = 0;
    let activitiesProcessed = 0;

    for (const row of rows) {
      const activity = mapRowToActivity(row);
      activitiesProcessed += 1;

      const startDate =
        activity.lastClosedDate !== null
          ? addDaysToDateString(activity.lastClosedDate, 1)
          : toDateStringFromIso(activity.createdAt);

      if (startDate > throughDate) {
        continue;
      }

      let cursor = startDate;
      while (cursor <= throughDate) {
        const created = await activityLogService.createMissedLog(
          activity.id,
          parseDateString(cursor),
        );

        if (created) {
          missedLogsCreated += 1;
        }

        cursor = addDaysToDateString(cursor, 1);
      }

      await activityRepository.updateLastClosedDate(activity.id, throughDate);
    }

    return {
      missedLogsCreated,
      activitiesProcessed,
      throughDate,
    };
  },

  /**
   * Input: activityId
   * Output: ActivityLog[] ordered by date ascending
   * Queries: SELECT … WHERE activity_id = ? ORDER BY date
   */
  async getLogsByActivityId(activityId: string): Promise<ActivityLog[]> {
    const rows = await logRepository.selectLogsByActivityId(activityId);
    return rows.map(mapRowToActivityLog);
  },

  /**
   * Input: activityId, startDate, endDate (YYYY-MM-DD)
   * Output: ActivityLog[] in range, ordered by date
   * Validation: startDate <= endDate
   * Queries: SELECT … WHERE activity_id = ? AND date BETWEEN ? AND ?
   */
  async getLogsByDateRange(
    activityId: string,
    startDate: string,
    endDate: string,
  ): Promise<ActivityLog[]> {
    if (startDate > endDate) {
      throw new ActivityLogValidationError('startDate must be on or before endDate.');
    }

    const rows = await logRepository.selectLogsByDateRange(activityId, startDate, endDate);
    return rows.map(mapRowToActivityLog);
  },

  /**
   * Input: activityId, frequency (epoch filter), optional limit
   * Output: unreported logs for report generation workflow
   * Queries: SELECT … WHERE activity_id = ? AND frequency = ? AND report_id IS NULL ORDER BY date LIMIT ?
   */
  async getUnreportedLogs(
    activityId: string,
    frequency: ActivityFrequency,
    limit?: number,
  ): Promise<ActivityLog[]> {
    const rows = await logRepository.selectUnreportedLogs(activityId, frequency, limit);
    return rows.map(mapRowToActivityLog);
  },

  /**
   * Input: activityId, date (YYYY-MM-DD)
   * Output: ActivityLog or null
   * Queries: SELECT … WHERE activity_id = ? AND date = ?
   */
  async getLogByActivityAndDate(activityId: string, date: string): Promise<ActivityLog | null> {
    const row = await logRepository.selectLogByActivityAndDate(activityId, date);
    return row ? mapRowToActivityLog(row) : null;
  },

  /**
   * Input: logIds[], reportId
   * Output: void
   * Validation: only unreported logs are updated
   * Queries: UPDATE activity_logs SET report_id = ? WHERE id IN (…) AND report_id IS NULL
   */
  async markLogsAsReported(logIds: string[], reportId: string): Promise<void> {
    if (!reportId) {
      throw new ActivityLogValidationError('reportId is required.');
    }

    await logRepository.markLogsAsReported(logIds, reportId);
  },
};
