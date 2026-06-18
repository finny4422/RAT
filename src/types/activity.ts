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
  updatedAt: string;
  lastClosedDate: string | null;
}

export type CreateActivityInput = Omit<
  Activity,
  'id' | 'createdAt' | 'updatedAt' | 'lastClosedDate'
>;
export type UpdateActivityInput = Partial<CreateActivityInput>;
