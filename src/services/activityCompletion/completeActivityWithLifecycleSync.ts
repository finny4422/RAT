import { DeviceEventEmitter } from 'react-native';

import { activityLogService } from '@/services/activityLog/activityLogService';
import { appLifecycleService } from '@/services/appLifecycle/appLifecycleService';

export const ACTIVITIES_CHANGED_EVENT = 'routine-tracker:activities-changed';

/**
 * Canonical completion path shared by the app UI and widget headless task.
 * recordCompletion → runFullLifecycleSync('completion')
 */
export async function completeActivityWithLifecycleSync(
  activityId: string,
  completedAt?: Date,
): Promise<void> {
  await activityLogService.recordCompletion(activityId, completedAt);
  await appLifecycleService.runFullLifecycleSync('completion');
  DeviceEventEmitter.emit(ACTIVITIES_CHANGED_EVENT, { activityId });
}
