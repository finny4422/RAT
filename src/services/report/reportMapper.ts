import type { Report } from '@/types';
import { ActivityFrequency } from '@/types';

import { REPORTS_COLUMNS, REPORTS_TABLE } from '@/database/schema';

export type ReportRow = {
  [REPORTS_COLUMNS.id]: string;
  [REPORTS_COLUMNS.activityId]: string;
  [REPORTS_COLUMNS.activityTitle]: string;
  [REPORTS_COLUMNS.activityFrequency]: string;
  [REPORTS_COLUMNS.reportType]: string;
  [REPORTS_COLUMNS.startDate]: string;
  [REPORTS_COLUMNS.endDate]: string;
  [REPORTS_COLUMNS.onTime]: number;
  [REPORTS_COLUMNS.late]: number;
  [REPORTS_COLUMNS.missed]: number;
  [REPORTS_COLUMNS.score]: number;
  [REPORTS_COLUMNS.createdAt]: string;
};

export const REPORT_SELECT_COLUMNS = `
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
`.trim();

export function mapRowToReport(row: ReportRow): Report {
  return {
    id: row[REPORTS_COLUMNS.id],
    activityId: row[REPORTS_COLUMNS.activityId],
    activityTitle: row[REPORTS_COLUMNS.activityTitle],
    activityFrequency: row[REPORTS_COLUMNS.activityFrequency] as ActivityFrequency,
    reportType: row[REPORTS_COLUMNS.reportType] as Report['reportType'],
    startDate: row[REPORTS_COLUMNS.startDate],
    endDate: row[REPORTS_COLUMNS.endDate],
    onTime: row[REPORTS_COLUMNS.onTime],
    late: row[REPORTS_COLUMNS.late],
    missed: row[REPORTS_COLUMNS.missed],
    score: row[REPORTS_COLUMNS.score],
    createdAt: row[REPORTS_COLUMNS.createdAt],
  };
}

export function reportsTableName(): string {
  return REPORTS_TABLE;
}
