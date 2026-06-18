import type { Activity } from '@/types';

export function useActivities() {
  const activities: Activity[] = [];

  return {
    activities,
    isLoading: false,
    error: null,
    refresh: async () => {},
  };
}
