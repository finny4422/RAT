import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bootstrapDatabase } from '@/database';
import { Colors } from '@/constants';
import { useWidgetDataSyncListener } from '@/hooks/useWidgetDataSyncListener';
import { appLifecycleService, widgetBridge } from '@/services';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useWidgetDataSyncListener(isReady);

  useEffect(() => {
    let cancelled = false;

    bootstrapDatabase()
      .then(() => appLifecycleService.runStartupSequence())
      .then((startupResult) => {
        if (cancelled) {
          return;
        }

        const cycleCloseFailed = startupResult.errors.some(
          (entry) => entry.step === 'cycleClose',
        );

        if (cycleCloseFailed) {
          const message =
            startupResult.errors.find((entry) => entry.step === 'cycleClose')?.error.message ??
            'Startup cycle close failed.';
          setErrorMessage(message);
          return;
        }

        setIsReady(true);
        void widgetBridge.scheduleBackgroundSync();
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Database initialization failed.';
          setErrorMessage(message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (errorMessage) {
    return (
      <SafeAreaProvider>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Database Error</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});
