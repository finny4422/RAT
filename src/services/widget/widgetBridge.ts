import { NativeModules, Platform } from 'react-native';

import {
  parseWidgetSnapshot,
  serializeWidgetSnapshot,
  type WidgetSnapshot,
} from './widgetSnapshot';

export type LifecycleSyncTrigger =
  | 'app_open'
  | 'widget_added'
  | 'phone_reboot'
  | 'date_changed'
  | 'periodic_sync'
  | 'completion'
  | 'activity_mutation';

export const LIFECYCLE_SYNC_TRIGGERS: LifecycleSyncTrigger[] = [
  'app_open',
  'widget_added',
  'phone_reboot',
  'date_changed',
  'periodic_sync',
  'completion',
  'activity_mutation',
];

type NativeRoutineTrackerWidget = {
  persistSnapshot(json: string, trigger: string): Promise<void>;
  reloadWidgetUI(): Promise<void>;
  getPersistedSnapshot(): Promise<string | null>;
  scheduleBackgroundSync(): Promise<void>;
};

export interface WidgetBridge {
  persistSnapshot(snapshot: WidgetSnapshot, trigger: LifecycleSyncTrigger): Promise<void>;
  reloadWidgetUI(): Promise<void>;
  getPersistedSnapshot(): Promise<WidgetSnapshot | null>;
  scheduleBackgroundSync(): Promise<void>;
}

/** In-memory fallback for non-Android platforms only (no native widget target). */
let stubSnapshot: WidgetSnapshot | null = null;
let stubTrigger: LifecycleSyncTrigger | null = null;

function isAndroidPlatform(): boolean {
  return Platform.OS === 'android';
}

/**
 * Resolves the native module at call time so bridge methods see a registered module
 * after React Native finishes startup (avoids import-time null binding).
 */
function resolveNativeModule(): NativeRoutineTrackerWidget | null {
  if (!isAndroidPlatform()) {
    return null;
  }

  return NativeModules.RoutineTrackerWidget ?? null;
}

function createNativeModuleUnavailableMessage(operation: string): string {
  return (
    `RoutineTrackerWidget native module is unavailable (${operation}). ` +
    'Build with "expo prebuild" and run an Android dev build. Expo Go does not include the widget bridge.'
  );
}

function requireAndroidNativeModule(operation: string): NativeRoutineTrackerWidget {
  const nativeModule = resolveNativeModule();

  if (nativeModule) {
    return nativeModule;
  }

  const message = createNativeModuleUnavailableMessage(operation);

  if (__DEV__) {
    throw new Error(message);
  }

  throw new Error(message);
}

function persistToStub(snapshot: WidgetSnapshot, trigger: LifecycleSyncTrigger): void {
  stubSnapshot = snapshot;
  stubTrigger = trigger;
}

export const widgetBridge: WidgetBridge = {
  async persistSnapshot(snapshot, trigger) {
    if (!isAndroidPlatform()) {
      persistToStub(snapshot, trigger);
      return;
    }

    const nativeModule = requireAndroidNativeModule('persistSnapshot');
    await nativeModule.persistSnapshot(serializeWidgetSnapshot(snapshot), trigger);
  },

  async reloadWidgetUI() {
    if (!isAndroidPlatform()) {
      return;
    }

    const nativeModule = requireAndroidNativeModule('reloadWidgetUI');
    await nativeModule.reloadWidgetUI();
  },

  async getPersistedSnapshot() {
    if (!isAndroidPlatform()) {
      return stubSnapshot;
    }

    const nativeModule = requireAndroidNativeModule('getPersistedSnapshot');
    const raw = await nativeModule.getPersistedSnapshot();
    return raw ? parseWidgetSnapshot(raw) : null;
  },

  async scheduleBackgroundSync() {
    if (!isAndroidPlatform()) {
      return;
    }

    const nativeModule = requireAndroidNativeModule('scheduleBackgroundSync');
    await nativeModule.scheduleBackgroundSync();
  },
};

export function getLastPersistTrigger(): LifecycleSyncTrigger | null {
  return stubTrigger;
}

export function isNativeWidgetBridgeAvailable(): boolean {
  return resolveNativeModule() !== null;
}

export { serializeWidgetSnapshot, parseWidgetSnapshot };
