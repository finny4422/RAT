export { runWidgetHeadlessTask, widgetHeadlessTask } from './headlessTask';
export type { WidgetHeadlessTaskPayload } from './headlessTask';
export { runWidgetCompletionTask, widgetCompletionTask } from './completionTask';
export type { WidgetCompletionTaskPayload } from './completionTask';

export async function syncWidgetData(): Promise<void> {
  const { runWidgetHeadlessTask } = await import('./headlessTask');
  await runWidgetHeadlessTask({ trigger: 'periodic_sync' });
}
