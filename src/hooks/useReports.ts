import type { Report } from '@/types';

export function useReports() {
  const reports: Report[] = [];

  return {
    reports,
    isLoading: false,
    error: null,
    refresh: async () => {},
  };
}
