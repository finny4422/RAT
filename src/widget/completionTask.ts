import { bootstrapDatabase } from '@/database';
import { completeActivityWithLifecycleSync } from '@/services';

export type WidgetCompletionTaskPayload = {
  activityId: string;
};

function extractActivityId(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Widget completion requires a payload with activityId.');
  }

  const record = payload as Record<string, unknown>;
  const activityId = record.activityId;

  if (typeof activityId !== 'string' || activityId.trim().length === 0) {
    throw new Error('Widget completion requires activityId.');
  }

  return activityId.trim();
}

/**
 * Headless entry for widget checkbox completion (no app UI).
 * Uses the same canonical completion path as the in-app checkbox.
 */
export async function runWidgetCompletionTask(payload: unknown): Promise<void> {
  const activityId = extractActivityId(payload);

  await bootstrapDatabase();
  await completeActivityWithLifecycleSync(activityId);
}

export default async function widgetCompletionTask(payload: unknown): Promise<void> {
  await runWidgetCompletionTask(payload);
}
