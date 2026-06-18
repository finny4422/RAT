import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '@/database';
import {
  ACTIVITIES_COLUMNS,
  ACTIVITIES_TABLE,
  ACTIVITY_LOGS_COLUMNS,
  ACTIVITY_LOGS_TABLE,
} from '@/database/schema';
import type { CreateActivityInput } from '@/types';
import { ActivityResult } from '@/types';

import type { ActivityRow } from './activityMapper';
import { ACTIVITY_SELECT_COLUMNS, activityTableName, mapRowToActivity } from './activityMapper';

async function db(): Promise<SQLiteDatabase> {
  return getDatabase();
}

export async function insertActivity(
  id: string,
  input: CreateActivityInput,
  timestamps: { createdAt: string; updatedAt: string },
): Promise<ActivityRow> {
  const database = await db();

  await database.runAsync(
    `INSERT INTO ${ACTIVITIES_TABLE} (
      ${ACTIVITIES_COLUMNS.id},
      ${ACTIVITIES_COLUMNS.title},
      ${ACTIVITIES_COLUMNS.caption},
      ${ACTIVITIES_COLUMNS.frequency},
      ${ACTIVITIES_COLUMNS.dueTime},
      ${ACTIVITIES_COLUMNS.warningMinutes},
      ${ACTIVITIES_COLUMNS.weekDay},
      ${ACTIVITIES_COLUMNS.monthDay},
      ${ACTIVITIES_COLUMNS.oneTimeDate},
      ${ACTIVITIES_COLUMNS.active},
      ${ACTIVITIES_COLUMNS.createdAt},
      ${ACTIVITIES_COLUMNS.updatedAt},
      ${ACTIVITIES_COLUMNS.lastClosedDate}
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      id,
      input.title.trim(),
      input.caption.trim(),
      input.frequency,
      input.dueTime,
      input.warningMinutes,
      input.weekDay,
      input.monthDay,
      input.oneTimeDate,
      input.active ? 1 : 0,
      timestamps.createdAt,
      timestamps.updatedAt,
    ],
  );

  const row = await selectActivityById(id);
  if (!row) {
    throw new Error('Failed to load activity after insert.');
  }

  return row;
}

export async function selectActivityById(id: string): Promise<ActivityRow | null> {
  const database = await db();

  return database.getFirstAsync<ActivityRow>(
    `SELECT ${ACTIVITY_SELECT_COLUMNS}
     FROM ${activityTableName()}
     WHERE ${ACTIVITIES_COLUMNS.id} = ?`,
    [id],
  );
}

export async function selectAllActivities(): Promise<ActivityRow[]> {
  const database = await db();

  return database.getAllAsync<ActivityRow>(
    `SELECT ${ACTIVITY_SELECT_COLUMNS}
     FROM ${activityTableName()}
     ORDER BY ${ACTIVITIES_COLUMNS.title} ASC`,
  );
}

export async function updateActivityRow(
  id: string,
  input: CreateActivityInput,
  updatedAt: string,
): Promise<ActivityRow | null> {
  const database = await db();

  await database.runAsync(
    `UPDATE ${ACTIVITIES_TABLE}
     SET ${ACTIVITIES_COLUMNS.title} = ?,
         ${ACTIVITIES_COLUMNS.caption} = ?,
         ${ACTIVITIES_COLUMNS.frequency} = ?,
         ${ACTIVITIES_COLUMNS.dueTime} = ?,
         ${ACTIVITIES_COLUMNS.warningMinutes} = ?,
         ${ACTIVITIES_COLUMNS.weekDay} = ?,
         ${ACTIVITIES_COLUMNS.monthDay} = ?,
         ${ACTIVITIES_COLUMNS.oneTimeDate} = ?,
         ${ACTIVITIES_COLUMNS.active} = ?,
         ${ACTIVITIES_COLUMNS.updatedAt} = ?
     WHERE ${ACTIVITIES_COLUMNS.id} = ?`,
    [
      input.title.trim(),
      input.caption.trim(),
      input.frequency,
      input.dueTime,
      input.warningMinutes,
      input.weekDay,
      input.monthDay,
      input.oneTimeDate,
      input.active ? 1 : 0,
      updatedAt,
      id,
    ],
  );

  return selectActivityById(id);
}

export async function deleteActivityById(id: string): Promise<boolean> {
  const database = await db();
  const result = await database.runAsync(
    `DELETE FROM ${ACTIVITIES_TABLE} WHERE ${ACTIVITIES_COLUMNS.id} = ?`,
    [id],
  );

  return result.changes > 0;
}

export async function selectActivityIdsWithLogOnDate(date: string): Promise<Set<string>> {
  const database = await db();
  const rows = await database.getAllAsync<{ activity_id: string }>(
    `SELECT ${ACTIVITY_LOGS_COLUMNS.activityId} AS activity_id
     FROM ${ACTIVITY_LOGS_TABLE}
     WHERE ${ACTIVITY_LOGS_COLUMNS.date} = ?`,
    [date],
  );

  return new Set(rows.map((row) => row.activity_id));
}

export async function selectActivityIdsWithCompletionLog(): Promise<Set<string>> {
  const database = await db();
  const rows = await database.getAllAsync<{ activity_id: string }>(
    `SELECT DISTINCT ${ACTIVITY_LOGS_COLUMNS.activityId} AS activity_id
     FROM ${ACTIVITY_LOGS_TABLE}
     WHERE ${ACTIVITY_LOGS_COLUMNS.result} IN (?, ?)`,
    [ActivityResult.OnTime, ActivityResult.Late],
  );

  return new Set(rows.map((row) => row.activity_id));
}

export async function updateLastClosedDate(id: string, lastClosedDate: string): Promise<void> {
  const database = await db();

  await database.runAsync(
    `UPDATE ${ACTIVITIES_TABLE}
     SET ${ACTIVITIES_COLUMNS.lastClosedDate} = ?
     WHERE ${ACTIVITIES_COLUMNS.id} = ?`,
    [lastClosedDate, id],
  );
}

export { mapRowToActivity };
