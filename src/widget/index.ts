// Native home screen widget integration will be implemented in a future phase.

export type WidgetPayload = {
  activityIds: string[];
};

export async function syncWidgetData(): Promise<void> {
  throw new Error('Not implemented');
}
