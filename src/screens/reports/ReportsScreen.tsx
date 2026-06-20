import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ReportCard, ScreenContainer } from '@/components';
import { Colors, Theme } from '@/constants';
import { useReports } from '@/hooks';

export function ReportsScreen() {
  const { reports, isLoading, isRefreshing, error, refresh, loadInitial } = useReports();
  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const load = async () => {
        if (!hasLoadedRef.current) {
          await loadInitial();
          hasLoadedRef.current = true;
          return;
        }

        if (!cancelled) {
          await refresh();
        }
      };

      void load();

      return () => {
        cancelled = true;
      };
    }, [loadInitial, refresh]),
  );

  if (isLoading && reports.length === 0) {
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
      <Text style={styles.title}>Reports</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={reports.length === 0 ? styles.emptyList : undefined}
        refreshing={isRefreshing}
        onRefresh={refresh}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No reports have been generated yet.</Text>
        }
        renderItem={({ item }) => <ReportCard report={item} />}
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
