import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '@/database';
import { ACTIVITY_LOGS_COLUMNS, ACTIVITY_LOGS_TABLE } from '@/database/schema';
import type { ActivityFrequency } from '@/types';
import { ActivityResult } from '@/types';

import type { ActivityLogRow } from './activityLogMapper';
import {
  ACTIVITY_LOG_SELECT_COLUMNS,
  activityLogsTableName,
  mapRowToActivityLog,
} from './activityLogMapper';
import { DuplicateActivityLogError } from './activityLogErrors';

async function db(): Promise<SQLiteDatabase> {
  return getDatabase();
}

export async function insertActivityLog(
  id: string,
  input: {
    activityId: string;
    date: string;
    dueTime: string;
    frequency: ActivityFrequency;
    completedAt: string | null;
    result: ActivityResult;
  },
  createdAt: string,
): Promise<ActivityLogRow> {
  const database = await db();

  try {
    await database.runAsync(
      `INSERT INTO ${ACTIVITY_LOGS_TABLE} (
        ${ACTIVITY_LOGS_COLUMNS.id},
        ${ACTIVITY_LOGS_COLUMNS.activityId},
        ${ACTIVITY_LOGS_COLUMNS.date},
        ${ACTIVITY_LOGS_COLUMNS.dueTime},
        ${ACTIVITY_LOGS_COLUMNS.frequency},
        ${ACTIVITY_LOGS_COLUMNS.completedAt},
        ${ACTIVITY_LOGS_COLUMNS.result},
        ${ACTIVITY_LOGS_COLUMNS.reportId},
        ${ACTIVITY_LOGS_COLUMNS.createdAt}
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      [
        id,
        input.activityId,
        input.date,
        input.dueTime,
        input.frequency,
        input.completedAt,
        input.result,
        createdAt,
      ],
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new DuplicateActivityLogError(input.activityId, input.date);
    }

    throw error;
  }

  const row = await selectLogByActivityAndDate(input.activityId, input.date);
  if (!row) {
    throw new Error('Failed to load activity log after insert.');
  }

  return row;
}

export async function selectLogByActivityAndDate(
  activityId: string,
  date: string,
): Promise<ActivityLogRow | null> {
  const database = await db();

  return database.getFirstAsync<ActivityLogRow>(
    `SELECT ${ACTIVITY_LOG_SELECT_COLUMNS}
     FROM ${activityLogsTableName()}
     WHERE ${ACTIVITY_LOGS_COLUMNS.activityId} = ?
       AND ${ACTIVITY_LOGS_COLUMNS.date} = ?`,
    [activityId, date],
  );
}

export async function selectLogsByActivityId(activityId: string): Promise<ActivityLogRow[]> {
  const database = await db();

  return database.getAllAsync<ActivityLogRow>(
    `SELECT ${ACTIVITY_LOG_SELECT_COLUMNS}
     FROM ${activityLogsTableName()}
     WHERE ${ACTIVITY_LOGS_COLUMNS.activityId} = ?
     ORDER BY ${ACTIVITY_LOGS_COLUMNS.date} ASC`,
    [activityId],
  );
}

export async function selectLogsByDateRange(
  activityId: string,
  startDate: string,
  endDate: string,
): Promise<ActivityLogRow[]> {
  const database = await db();

  return database.getAllAsync<ActivityLogRow>(
    `SELECT ${ACTIVITY_LOG_SELECT_COLUMNS}
     FROM ${activityLogsTableName()}
     WHERE ${ACTIVITY_LOGS_COLUMNS.activityId} = ?
       AND ${ACTIVITY_LOGS_COLUMNS.date} >= ?
       AND ${ACTIVITY_LOGS_COLUMNS.date} <= ?
     ORDER BY ${ACTIVITY_LOGS_COLUMNS.date} ASC`,
    [activityId, startDate, endDate],
  );
}

export async function selectUnreportedLogs(
  activityId: string,
  frequency: ActivityFrequency,
  limit?: number,
): Promise<ActivityLogRow[]> {
  const database = await db();

  const sql = `
    SELECT ${ACTIVITY_LOG_SELECT_COLUMNS}
    FROM ${activityLogsTableName()}
    WHERE ${ACTIVITY_LOGS_COLUMNS.activityId} = ?
      AND ${ACTIVITY_LOGS_COLUMNS.frequency} = ?
      AND ${ACTIVITY_LOGS_COLUMNS.reportId} IS NULL
    ORDER BY ${ACTIVITY_LOGS_COLUMNS.date} ASC
    ${limit !== undefined ? 'LIMIT ?' : ''}`;

  const params =
    limit !== undefined ? [activityId, frequency, limit] : [activityId, frequency];

  return database.getAllAsync<ActivityLogRow>(sql, params);
}

export async function updateLogCompletion(
  activityId: string,
  date: string,
  completedAt: string,
  result: ActivityResult.OnTime | ActivityResult.Late,
): Promise<ActivityLogRow | null> {
  const database = await db();

  await database.runAsync(
    `UPDATE ${ACTIVITY_LOGS_TABLE}
     SET ${ACTIVITY_LOGS_COLUMNS.completedAt} = ?,
         ${ACTIVITY_LOGS_COLUMNS.result} = ?
     WHERE ${ACTIVITY_LOGS_COLUMNS.activityId} = ?
       AND ${ACTIVITY_LOGS_COLUMNS.date} = ?
       AND ${ACTIVITY_LOGS_COLUMNS.result} = ?`,
    [completedAt, result, activityId, date, ActivityResult.Missed],
  );

  return selectLogByActivityAndDate(activityId, date);
}

export async function markLogsAsReported(logIds: string[], reportId: string): Promise<void> {
  if (logIds.length === 0) {
    return;
  }

  const database = await db();
  const placeholders = logIds.map(() => '?').join(', ');

  await database.runAsync(
    `UPDATE ${ACTIVITY_LOGS_TABLE}
     SET ${ACTIVITY_LOGS_COLUMNS.reportId} = ?
     WHERE ${ACTIVITY_LOGS_COLUMNS.id} IN (${placeholders})
       AND ${ACTIVITY_LOGS_COLUMNS.reportId} IS NULL`,
    [reportId, ...logIds],
  );
}

export { mapRowToActivityLog };
