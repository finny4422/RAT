import { activityLogService } from '@/services/activityLog/activityLogService';

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
  await activityLogService.recordCompletion(activityId, completedAt);
  await syncActivitiesAndWidget('completion');
}
