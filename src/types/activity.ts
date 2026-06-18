import { ActivityFrequency } from './enums';

export interface Activity {
  id: string;
  title: string;
  caption: string;
  frequency: ActivityFrequency;
  dueTime: string;
  warningMinutes: number;
  weekDay: number | null;
  monthDay: number | null;
  oneTimeDate: string | null;
  active: boolean;
  createdAt: string;
}

export type CreateActivityInput = Omit<Activity, 'id' | 'createdAt'>;
export type UpdateActivityInput = Partial<CreateActivityInput>;
