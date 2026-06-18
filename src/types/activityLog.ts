import type { ActivityFrequency, ActivityResult } from './enums';

export interface ActivityLog {
  id: string;
  activityId: string;
  date: string;
  dueTime: string;
  frequency: ActivityFrequency;
  completedAt: string | null;
  result: ActivityResult;
  reportId: string | null;
  createdAt: string;
}

export type CreateActivityLogInput = Omit<ActivityLog, 'id' | 'reportId' | 'createdAt'>;
