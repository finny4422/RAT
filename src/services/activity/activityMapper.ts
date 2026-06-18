import type { Activity } from '@/types';
import { ActivityFrequency } from '@/types';

import { ACTIVITIES_COLUMNS, ACTIVITIES_TABLE } from '@/database/schema';

export type ActivityRow = {
  [ACTIVITIES_COLUMNS.id]: string;
  [ACTIVITIES_COLUMNS.title]: string;
  [ACTIVITIES_COLUMNS.caption]: string;
  [ACTIVITIES_COLUMNS.frequency]: string;
  [ACTIVITIES_COLUMNS.dueTime]: string;
  [ACTIVITIES_COLUMNS.warningMinutes]: number;
  [ACTIVITIES_COLUMNS.weekDay]: number | null;
  [ACTIVITIES_COLUMNS.monthDay]: number | null;
  [ACTIVITIES_COLUMNS.oneTimeDate]: string | null;
  [ACTIVITIES_COLUMNS.active]: number;
  [ACTIVITIES_COLUMNS.createdAt]: string;
  [ACTIVITIES_COLUMNS.updatedAt]: string;
  [ACTIVITIES_COLUMNS.lastClosedDate]: string | null;
};

export const ACTIVITY_SELECT_COLUMNS = `
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
`.trim();

export function mapRowToActivity(row: ActivityRow): Activity {
  return {
    id: row[ACTIVITIES_COLUMNS.id],
    title: row[ACTIVITIES_COLUMNS.title],
    caption: row[ACTIVITIES_COLUMNS.caption],
    frequency: row[ACTIVITIES_COLUMNS.frequency] as ActivityFrequency,
    dueTime: row[ACTIVITIES_COLUMNS.dueTime],
    warningMinutes: row[ACTIVITIES_COLUMNS.warningMinutes],
    weekDay: row[ACTIVITIES_COLUMNS.weekDay],
    monthDay: row[ACTIVITIES_COLUMNS.monthDay],
    oneTimeDate: row[ACTIVITIES_COLUMNS.oneTimeDate],
    active: row[ACTIVITIES_COLUMNS.active] === 1,
    createdAt: row[ACTIVITIES_COLUMNS.createdAt],
    updatedAt: row[ACTIVITIES_COLUMNS.updatedAt],
    lastClosedDate: row[ACTIVITIES_COLUMNS.lastClosedDate],
  };
}

export function activityTableName(): string {
  return ACTIVITIES_TABLE;
}
