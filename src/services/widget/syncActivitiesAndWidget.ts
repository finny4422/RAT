import { DeviceEventEmitter } from 'react-native';

import type { LifecycleSyncResult } from '@/services/appLifecycle/appLifecycleService';
import { appLifecycleService } from '@/services/appLifecycle/appLifecycleService';
import { logDbLifecycle } from '@/database/dbLifecycle';

import { ACTIVITIES_CHANGED_EVENT } from '../activityCompletion/completeActivityWithLifecycleSync';
import type { LifecycleSyncTrigger } from './widgetBridge';

/**
 * Canonical post-mutation sync: cycle close → reports → widget snapshot → native UI refresh.
 * Emits ACTIVITIES_CHANGED_EVENT when lifecycle sync succeeds so the app UI can refresh.
 */
export async function syncActivitiesAndWidget(
  trigger: LifecycleSyncTrigger,
  currentTime?: Date,
): Promise<LifecycleSyncResult> {
  logDbLifecycle('widget-sync: start', { trigger });

  const result = await appLifecycleService.runFullLifecycleSync(
    trigger,
    currentTime ?? new Date(),
  );

  const cycleCloseFailed = result.errors.some((entry) => entry.step === 'cycleClose');

  logDbLifecycle('widget-sync: complete', {
    trigger,
    widgetRefreshed: result.widgetRefreshed,
    errorCount: result.errors.length,
  });

  if (!cycleCloseFailed) {
    DeviceEventEmitter.emit(ACTIVITIES_CHANGED_EVENT, { trigger, source: 'sync' });
  }

  return result;
}
