import type { ActivityResult } from './enums';

export interface ActivityLog {
  id: string;
  activityId: string;
  date: string;
  dueTime: string;
  completedAt: string | null;
  result: ActivityResult;
}
