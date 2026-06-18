import { ActivityStatus } from '@/types';

export const StatusColors: Record<ActivityStatus, string> = {
  [ActivityStatus.Pending]: '#FFFFFF',
  [ActivityStatus.DueSoon]: '#FFEB3B',
  [ActivityStatus.Missed]: '#F44336',
};

export const Colors = {
  background: '#F5F5F5',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  primary: '#1976D2',
} as const;
