import { useEffect } from 'react';
import { AppState, DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } from 'react-native';

import { refreshDatabaseConnection } from '@/database';
import { ACTIVITIES_CHANGED_EVENT } from '@/services/activityCompletion';
import { widgetBridge, WIDGET_DATA_MUTATED_EVENT } from '@/services/widget/widgetBridge';

let lastSeenMutationVersion = 0;

async function pollMutationVersionAndNotify(): Promise<void> {
  const version = await widgetBridge.getDataMutationVersion();

  if (version > lastSeenMutationVersion) {
    lastSeenMutationVersion = version;
    await refreshDatabaseConnection();
    DeviceEventEmitter.emit(ACTIVITIES_CHANGED_EVENT, { source: 'mutation-version' });
  }
}

/**
 * Listens for native widget/data mutations (including headless widget completion)
 * and refreshes app state when the shared DB or widget snapshot changes.
 */
export function useWidgetDataSyncListener(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') {
      return;
    }

    const nativeModule = NativeModules.RoutineTrackerWidget;
    let nativeSubscription: { remove: () => void } | null = null;

    if (nativeModule) {
      const emitter = new NativeEventEmitter(nativeModule);
      nativeSubscription = emitter.addListener(WIDGET_DATA_MUTATED_EVENT, () => {
        void pollMutationVersionAndNotify();
      });
    }

    void widgetBridge.getDataMutationVersion().then((version) => {
      lastSeenMutationVersion = version;
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void pollMutationVersionAndNotify();
      }
    });

    return () => {
      nativeSubscription?.remove();
      appStateSubscription.remove();
    };
  }, [enabled]);
}
