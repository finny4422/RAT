import { ActivityResult } from '@/types';

export const ACTIVITY_LOGS_TABLE = 'activity_logs';

export const ACTIVITY_LOGS_COLUMNS = {
  id: 'id',
  activityId: 'activity_id',
  date: 'date',
  dueTime: 'due_time',
  completedAt: 'completed_at',
  result: 'result',
} as const;

export const ACTIVITY_LOG_RESULT_VALUES = Object.values(ActivityResult);
