export const ACTIVITIES_TABLE = 'activities';

export const ACTIVITIES_COLUMNS = {
  id: 'id',
  title: 'title',
  caption: 'caption',
  frequency: 'frequency',
  dueTime: 'due_time',
  warningMinutes: 'warning_minutes',
  weekDay: 'week_day',
  monthDay: 'month_day',
  oneTimeDate: 'one_time_date',
  active: 'active',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  lastClosedDate: 'last_closed_date',
} as const;

export const ACTIVITY_FREQUENCIES = ['daily', 'weekly', 'monthly', 'one_time'] as const;
