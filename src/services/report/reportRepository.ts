import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '@/database';
import { ACTIVITY_LOGS_COLUMNS, ACTIVITY_LOGS_TABLE, REPORTS_COLUMNS, REPORTS_TABLE } from '@/database/schema';
import type { ActivityFrequency } from '@/types';

import type { ReportRow } from './reportMapper';
import { REPORT_SELECT_COLUMNS, mapRowToReport, reportsTableName } from './reportMapper';

async function db(): Promise<SQLiteDatabase> {
  return getDatabase();
}

export type InsertReportInput = {
  id: string;
  activityId: string;
  activityTitle: string;
  activityFrequency: ActivityFrequency;
  reportType: string;
  startDate: string;
  endDate: string;
  onTime: number;
  late: number;
  missed: number;
  score: number;
  createdAt: string;
};

export async function insertReport(input: InsertReportInput): Promise<ReportRow> {
  const database = await db();

  await database.runAsync(
    `INSERT INTO ${REPORTS_TABLE} (
      ${REPORTS_COLUMNS.id},
      ${REPORTS_COLUMNS.activityId},
      ${REPORTS_COLUMNS.activityTitle},
      ${REPORTS_COLUMNS.activityFrequency},
      ${REPORTS_COLUMNS.reportType},
      ${REPORTS_COLUMNS.startDate},
      ${REPORTS_COLUMNS.endDate},
      ${REPORTS_COLUMNS.onTime},
      ${REPORTS_COLUMNS.late},
      ${REPORTS_COLUMNS.missed},
      ${REPORTS_COLUMNS.score},
      ${REPORTS_COLUMNS.createdAt}
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.activityId,
      input.activityTitle,
      input.activityFrequency,
      input.reportType,
      input.startDate,
      input.endDate,
      input.onTime,
      input.late,
      input.missed,
      input.score,
      input.createdAt,
    ],
  );

  const row = await selectReportById(input.id);
  if (!row) {
    throw new Error('Failed to load report after insert.');
  }

  return row;
}

export async function selectReportById(id: string): Promise<ReportRow | null> {
  const database = await db();

  return database.getFirstAsync<ReportRow>(
    `SELECT ${REPORT_SELECT_COLUMNS}
     FROM ${reportsTableName()}
     WHERE ${REPORTS_COLUMNS.id} = ?`,
    [id],
  );
}

export async function selectAllReports(): Promise<ReportRow[]> {
  const database = await db();

  return database.getAllAsync<ReportRow>(
    `SELECT ${REPORT_SELECT_COLUMNS}
     FROM ${reportsTableName()}
     ORDER BY ${REPORTS_COLUMNS.createdAt} DESC`,
  );
}

export async function selectReportsByActivityId(activityId: string): Promise<ReportRow[]> {
  const database = await db();

  return database.getAllAsync<ReportRow>(
    `SELECT ${REPORT_SELECT_COLUMNS}
     FROM ${reportsTableName()}
     WHERE ${REPORTS_COLUMNS.activityId} = ?
     ORDER BY ${REPORTS_COLUMNS.createdAt} DESC`,
    [activityId],
  );
}

export async function selectDistinctActivityIdsWithUnreportedLogs(): Promise<string[]> {
  const database = await db();

  const rows = await database.getAllAsync<{ activity_id: string }>(
    `SELECT DISTINCT ${ACTIVITY_LOGS_COLUMNS.activityId} AS activity_id
     FROM ${ACTIVITY_LOGS_TABLE}
     WHERE ${ACTIVITY_LOGS_COLUMNS.reportId} IS NULL
     ORDER BY ${ACTIVITY_LOGS_COLUMNS.activityId} ASC`,
  );

  return rows.map((row) => row.activity_id);
}

export async function selectDistinctUnreportedFrequencies(
  activityId: string,
): Promise<ActivityFrequency[]> {
  const database = await db();

  const rows = await database.getAllAsync<{ frequency: string }>(
    `SELECT DISTINCT ${ACTIVITY_LOGS_COLUMNS.frequency} AS frequency
     FROM ${ACTIVITY_LOGS_TABLE}
     WHERE ${ACTIVITY_LOGS_COLUMNS.activityId} = ?
       AND ${ACTIVITY_LOGS_COLUMNS.reportId} IS NULL
     ORDER BY ${ACTIVITY_LOGS_COLUMNS.frequency} ASC`,
    [activityId],
  );

  return rows.map((row) => row.frequency as ActivityFrequency);
}

export async function markLogsAsReportedInTransaction(
  logIds: string[],
  reportId: string,
  insert: () => Promise<ReportRow>,
): Promise<ReportRow> {
  const database = await db();

  await database.execAsync('BEGIN IMMEDIATE TRANSACTION;');

  try {
    const reportRow = await insert();

    if (logIds.length > 0) {
      const placeholders = logIds.map(() => '?').join(', ');
      const result = await database.runAsync(
        `UPDATE ${ACTIVITY_LOGS_TABLE}
         SET ${ACTIVITY_LOGS_COLUMNS.reportId} = ?
         WHERE ${ACTIVITY_LOGS_COLUMNS.id} IN (${placeholders})
           AND ${ACTIVITY_LOGS_COLUMNS.reportId} IS NULL`,
        [reportId, ...logIds],
      );

      if (result.changes !== logIds.length) {
        throw new Error('Failed to link all activity logs to the report.');
      }
    }

    await database.execAsync('COMMIT;');
    return reportRow;
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }
}

export { mapRowToReport };
