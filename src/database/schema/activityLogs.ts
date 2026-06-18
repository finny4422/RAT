import { ActivityResult } from '@/types';

export const ACTIVITY_LOGS_TABLE = 'activity_logs';

export const ACTIVITY_LOGS_COLUMNS = {
  id: 'id',
  activityId: 'activity_id',
  date: 'date',
  dueTime: 'due_time',
  frequency: 'frequency',
  completedAt: 'completed_at',
  result: 'result',
  reportId: 'report_id',
  createdAt: 'created_at',
} as const;

export const ACTIVITY_LOG_RESULT_VALUES = Object.values(ActivityResult);

/** Unique constraint: one log per (activity_id, date) */
export const ACTIVITY_LOGS_UNIQUE_CYCLE = ['activity_id', 'date'] as const;
