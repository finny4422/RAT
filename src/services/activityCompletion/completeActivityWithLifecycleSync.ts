import { activityLogService } from '@/services/activityLog/activityLogService';

import { logDbLifecycle } from '@/database/dbLifecycle';
import { syncActivitiesAndWidget } from '@/services/widget/syncActivitiesAndWidget';

export const ACTIVITIES_CHANGED_EVENT = 'routine-tracker:activities-changed';

/**
 * Canonical completion path shared by the app UI and widget headless task.
 * recordCompletion → syncActivitiesAndWidget('completion')
 */
export async function completeActivityWithLifecycleSync(
  activityId: string,
  completedAt?: Date,
): Promise<void> {
  logDbLifecycle('completion: record start', { activityId });
  await activityLogService.recordCompletion(activityId, completedAt);
  logDbLifecycle('completion: record complete', { activityId });
  await syncActivitiesAndWidget('completion');
}
