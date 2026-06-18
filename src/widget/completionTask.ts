import { bootstrapDatabase } from '@/database';
import { activityLogService, appLifecycleService } from '@/services';

export type WidgetCompletionTaskPayload = {
  activityId: string;
};

/**
 * Headless entry for widget checkbox completion (no app UI).
 * recordCompletion → runFullLifecycleSync('completion')
 */
export async function runWidgetCompletionTask(
  payload: WidgetCompletionTaskPayload,
): Promise<void> {
  if (!payload.activityId) {
    throw new Error('Widget completion requires activityId.');
  }

  await bootstrapDatabase();
  await activityLogService.recordCompletion(payload.activityId);
  await appLifecycleService.runFullLifecycleSync('completion');
}

export default async function widgetCompletionTask(
  payload: WidgetCompletionTaskPayload,
): Promise<void> {
  await runWidgetCompletionTask(payload);
}
