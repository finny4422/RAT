import { bootstrapDatabase } from '@/database';
import { appLifecycleService } from '@/services/appLifecycle/appLifecycleService';
import type { LifecycleSyncTrigger } from '@/services/widget/widgetBridge';
import { widgetBridge } from '@/services/widget/widgetBridge';

export type WidgetHeadlessTaskPayload = {
  trigger?: LifecycleSyncTrigger;
};

/**
 * Android headless sync entry point.
 * Every trigger runs runFullLifecycleSync (mini app launch).
 */
export async function runWidgetHeadlessTask(
  payload: WidgetHeadlessTaskPayload = {},
): Promise<void> {
  const trigger = payload.trigger ?? 'periodic_sync';

  await bootstrapDatabase();
  await appLifecycleService.runFullLifecycleSync(trigger);
  await widgetBridge.scheduleBackgroundSync();
}

export default async function widgetHeadlessTask(
  payload: WidgetHeadlessTaskPayload = {},
): Promise<void> {
  await runWidgetHeadlessTask(payload);
}
