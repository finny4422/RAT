import { ACTIVITIES_COLUMNS, ACTIVITIES_TABLE } from '@/database/schema';

import { normalizeActivity } from './normalizeActivity';

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
  return normalizeActivity(row);
}

export function activityTableName(): string {
  return ACTIVITIES_TABLE;
}
