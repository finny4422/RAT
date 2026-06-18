import type { ActivityLog } from '@/types';

export function useActivityLogs(activityId?: string) {
  const logs: ActivityLog[] = [];

  return {
    logs,
    isLoading: false,
    error: null,
    refresh: async () => {},
    activityId,
  };
}
