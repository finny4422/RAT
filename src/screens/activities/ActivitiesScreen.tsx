import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActivityCard, ScreenContainer } from '@/components';
import { Colors, Theme } from '@/constants';
import { useActivities } from '@/hooks';
import { normalizeVisibleActivity } from '@/services/activity/normalizeActivity';

const PERIODIC_REFRESH_MS = 60_000;

export function ActivitiesScreen() {
  const {
    activities,
    isLoading,
    isRefreshing,
    error,
    completingId,
    refresh,
    silentRefresh,
    loadInitial,
    completeActivity,
  } = useActivities();
  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let intervalId: ReturnType<typeof setInterval> | null = null;
      let cancelled = false;

      const startPeriodicRefresh = () => {
        intervalId = setInterval(() => {
          void silentRefresh();
        }, PERIODIC_REFRESH_MS);
      };

      const load = async () => {
        if (!hasLoadedRef.current) {
          await loadInitial();
          hasLoadedRef.current = true;
        } else {
          await refresh();
        }

        if (!cancelled) {
          startPeriodicRefresh();
        }
      };

      void load();

      return () => {
        cancelled = true;

        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [loadInitial, refresh, silentRefresh]),
  );

  if (isLoading && activities.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Activities</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={activities}
        keyExtractor={(item, index) => {
          const visible = normalizeVisibleActivity(item);
          return visible.activity.id || `activity-${index}`;
        }}
        contentContainerStyle={activities.length === 0 ? styles.emptyList : undefined}
        refreshing={isRefreshing}
        onRefresh={refresh}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No activities require action today.</Text>
        }
        renderItem={({ item }) => {
          const visible = normalizeVisibleActivity(item);

          return (
            <ActivityCard
              activity={visible.activity}
              status={visible.status}
              disabled={completingId === visible.activity.id}
              onComplete={() => completeActivity(visible.activity.id)}
            />
          );
        }}
        style={styles.list}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: Theme.screenTitle,
  list: {
    flex: 1,
  },
  centered: Theme.centered,
  emptyList: Theme.emptyList,
  emptyText: Theme.emptyText,
  error: Theme.screenError,
});
