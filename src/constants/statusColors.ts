import { ActivityStatus } from '@/types';

const STATUS_BACKGROUND: Record<ActivityStatus, string> = {
  [ActivityStatus.Pending]: '#2C2C2E',
  [ActivityStatus.DueSoon]: '#3A3220',
  [ActivityStatus.Missed]: '#3A2024',
};

const STATUS_ACCENT: Record<ActivityStatus, string> = {
  [ActivityStatus.Pending]: '#3A3A3C',
  [ActivityStatus.DueSoon]: '#FFD60A',
  [ActivityStatus.Missed]: '#FF453A',
};

const FALLBACK_BACKGROUND = '#2C2C2E';
const FALLBACK_ACCENT = '#3A3A3C';

export function getStatusCardColors(status: ActivityStatus): {
  background: string;
  accent: string;
} {
  return {
    background: STATUS_BACKGROUND[status] ?? FALLBACK_BACKGROUND,
    accent: STATUS_ACCENT[status] ?? FALLBACK_ACCENT,
  };
}

export const StatusColors = STATUS_BACKGROUND;
export const StatusAccentColors = STATUS_ACCENT;
