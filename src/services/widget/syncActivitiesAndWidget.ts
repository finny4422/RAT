import { DeviceEventEmitter } from 'react-native';

import type { LifecycleSyncResult } from '@/services/appLifecycle/appLifecycleService';
import { appLifecycleService } from '@/services/appLifecycle/appLifecycleService';

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
  const result = await appLifecycleService.runFullLifecycleSync(
    trigger,
    currentTime ?? new Date(),
  );

  const cycleCloseFailed = result.errors.some((entry) => entry.step === 'cycleClose');

  if (!cycleCloseFailed) {
    DeviceEventEmitter.emit(ACTIVITIES_CHANGED_EVENT, { trigger, source: 'sync' });
  }

  return result;
}
