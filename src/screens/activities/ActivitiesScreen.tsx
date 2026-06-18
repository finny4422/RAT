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
import { Colors } from '@/constants';
import { useActivities } from '@/hooks';

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
          <ActivityIndicator size="large" />
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
        keyExtractor={(item) => item.activity.id}
        contentContainerStyle={activities.length === 0 ? styles.emptyList : undefined}
        refreshing={isRefreshing}
        onRefresh={refresh}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No activities require action today.</Text>
        }
        renderItem={({ item }) => (
          <ActivityCard
            activity={item.activity}
            status={item.status}
            disabled={completingId === item.activity.id}
            onComplete={() => completeActivity(item.activity.id)}
          />
        )}
        style={styles.list}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: Colors.text,
  },
  list: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
});
