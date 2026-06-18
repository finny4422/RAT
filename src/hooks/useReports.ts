import { useCallback, useState } from 'react';

import { reportService } from '@/services';
import type { Report } from '@/types';

type UseReportsState = {
  reports: Report[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

function reportsEqual(current: Report[], next: Report[]): boolean {
  if (current.length !== next.length) {
    return false;
  }

  return current.every((report, index) => {
    const other = next[index];

    return (
      report.id === other.id &&
      report.activityTitle === other.activityTitle &&
      report.activityFrequency === other.activityFrequency &&
      report.reportType === other.reportType &&
      report.startDate === other.startDate &&
      report.endDate === other.endDate &&
      report.onTime === other.onTime &&
      report.late === other.late &&
      report.missed === other.missed &&
      report.score === other.score
    );
  });
}

export function useReports() {
  const [state, setState] = useState<UseReportsState>({
    reports: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const loadReports = useCallback(async (mode: 'initial' | 'refresh') => {
    setState((current: UseReportsState) => ({
      ...current,
      isLoading: mode === 'initial' ? true : current.isLoading,
      isRefreshing: mode === 'refresh',
      error: null,
    }));

    try {
      const reports = await reportService.getReportHistory();

      setState((current: UseReportsState) => {
        if (reportsEqual(current.reports, reports)) {
          return {
            ...current,
            isLoading: false,
            isRefreshing: false,
            error: null,
          };
        }

        return {
          ...current,
          reports,
          isLoading: false,
          isRefreshing: false,
          error: null,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load reports.';

      setState((current: UseReportsState) => ({
        ...current,
        isLoading: false,
        isRefreshing: false,
        error: message,
      }));
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadReports('refresh');
  }, [loadReports]);

  const loadInitial = useCallback(async () => {
    await loadReports('initial');
  }, [loadReports]);

  return {
    reports: state.reports,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    refresh,
    loadInitial,
  };
}
