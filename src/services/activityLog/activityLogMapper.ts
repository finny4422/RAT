import type { ActivityLog } from '@/types';
import { ActivityFrequency } from '@/types';

import { ACTIVITY_LOGS_COLUMNS, ACTIVITY_LOGS_TABLE } from '@/database/schema';

export type ActivityLogRow = {
  [ACTIVITY_LOGS_COLUMNS.id]: string;
  [ACTIVITY_LOGS_COLUMNS.activityId]: string;
  [ACTIVITY_LOGS_COLUMNS.date]: string;
  [ACTIVITY_LOGS_COLUMNS.dueTime]: string;
  [ACTIVITY_LOGS_COLUMNS.frequency]: string;
  [ACTIVITY_LOGS_COLUMNS.completedAt]: string | null;
  [ACTIVITY_LOGS_COLUMNS.result]: string;
  [ACTIVITY_LOGS_COLUMNS.reportId]: string | null;
  [ACTIVITY_LOGS_COLUMNS.createdAt]: string;
};

export const ACTIVITY_LOG_SELECT_COLUMNS = `
  ${ACTIVITY_LOGS_COLUMNS.id},
  ${ACTIVITY_LOGS_COLUMNS.activityId},
  ${ACTIVITY_LOGS_COLUMNS.date},
  ${ACTIVITY_LOGS_COLUMNS.dueTime},
  ${ACTIVITY_LOGS_COLUMNS.frequency},
  ${ACTIVITY_LOGS_COLUMNS.completedAt},
  ${ACTIVITY_LOGS_COLUMNS.result},
  ${ACTIVITY_LOGS_COLUMNS.reportId},
  ${ACTIVITY_LOGS_COLUMNS.createdAt}
`.trim();

export function mapRowToActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row[ACTIVITY_LOGS_COLUMNS.id],
    activityId: row[ACTIVITY_LOGS_COLUMNS.activityId],
    date: row[ACTIVITY_LOGS_COLUMNS.date],
    dueTime: row[ACTIVITY_LOGS_COLUMNS.dueTime],
    frequency: row[ACTIVITY_LOGS_COLUMNS.frequency] as ActivityFrequency,
    completedAt: row[ACTIVITY_LOGS_COLUMNS.completedAt],
    result: row[ACTIVITY_LOGS_COLUMNS.result] as ActivityLog['result'],
    reportId: row[ACTIVITY_LOGS_COLUMNS.reportId],
    createdAt: row[ACTIVITY_LOGS_COLUMNS.createdAt],
  };
}

export function activityLogsTableName(): string {
  return ACTIVITY_LOGS_TABLE;
}
