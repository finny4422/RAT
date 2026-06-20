import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

import { activityService, completeActivityWithLifecycleSync, ACTIVITIES_CHANGED_EVENT, type VisibleActivity } from '@/services';
import { normalizeVisibleActivity } from '@/services/activity/normalizeActivity';
import { refreshDatabaseConnection } from '@/database';

type UseActivitiesState = {
  activities: VisibleActivity[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  completingId: string | null;
};

function visibleActivitiesEqual(
  current: VisibleActivity[],
  next: VisibleActivity[],
): boolean {
  if (current.length !== next.length) {
    return false;
  }

  return current.every((item, index) => {
    const other = next[index];
    const activity = item.activity;
    const otherActivity = other.activity;

    return (
      item.status === other.status &&
      activity.id === otherActivity.id &&
      activity.title === otherActivity.title &&
      activity.caption === otherActivity.caption &&
      activity.dueTime === otherActivity.dueTime
    );
  });
}

export function useActivities() {
  const [state, setState] = useState<UseActivitiesState>({
    activities: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
    completingId: null,
  });

  const loadActivities = useCallback(async (mode: 'initial' | 'refresh') => {
    setState((current: UseActivitiesState) => ({
      ...current,
      isLoading: mode === 'initial' ? true : current.isLoading,
      isRefreshing: mode === 'refresh',
      error: null,
    }));

    try {
      await refreshDatabaseConnection();
      const activities = (await activityService.getTodaysVisibleActivities()).map(
        normalizeVisibleActivity,
      );

      setState((current: UseActivitiesState) => {
        if (visibleActivitiesEqual(current.activities, activities)) {
          return {
            ...current,
            isLoading: false,
            isRefreshing: false,
            error: null,
          };
        }

        return {
          ...current,
          activities,
          isLoading: false,
          isRefreshing: false,
          error: null,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load activities.';

      setState((current: UseActivitiesState) => ({
        ...current,
        isLoading: false,
        isRefreshing: false,
        error: message,
      }));
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadActivities('refresh');
  }, [loadActivities]);

  const silentRefresh = useCallback(async () => {
    try {
      await refreshDatabaseConnection();
      const activities = (await activityService.getTodaysVisibleActivities()).map(
        normalizeVisibleActivity,
      );

      setState((current: UseActivitiesState) => {
        if (visibleActivitiesEqual(current.activities, activities)) {
          return current;
        }

        return {
          ...current,
          activities,
        };
      });
    } catch {
      // Background poll failures should not disturb the current UI state.
    }
  }, []);

  const loadInitial = useCallback(async () => {
    await loadActivities('initial');
  }, [loadActivities]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(ACTIVITIES_CHANGED_EVENT, () => {
      void refresh();
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  const completeActivity = useCallback(
    async (activityId: string) => {
      setState((current: UseActivitiesState) => ({
        ...current,
        completingId: activityId,
        error: null,
      }));

      try {
        await completeActivityWithLifecycleSync(activityId);
        await loadActivities('refresh');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to complete activity.';

        setState((current: UseActivitiesState) => ({
          ...current,
          completingId: null,
          error: message,
        }));

        await loadActivities('refresh');
        return;
      }

      setState((current: UseActivitiesState) => ({
        ...current,
        completingId: null,
      }));
    },
    [loadActivities],
  );

  return {
    activities: state.activities,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    completingId: state.completingId,
    refresh,
    silentRefresh,
    loadInitial,
    completeActivity,
  };
}
