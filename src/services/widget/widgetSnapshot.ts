import type { VisibleActivity } from '@/services/activity/activityService';
import type { ActivityStatus } from '@/types';

export const WIDGET_SNAPSHOT_VERSION = 1 as const;
export const WIDGET_ACTIVITY_LIMIT = 2 as const;

export type WidgetActivityItem = {
  id: string;
  title: string;
  dueTime: string;
  status: ActivityStatus;
};

export type WidgetSnapshot = {
  version: typeof WIDGET_SNAPSHOT_VERSION;
  generatedAt: string;
  currentTime: string;
  activities: WidgetActivityItem[];
};

export function mapVisibleActivityToWidgetItem(item: VisibleActivity): WidgetActivityItem {
  return {
    id: item.activity.id,
    title: item.activity.title,
    dueTime: item.activity.dueTime,
    status: item.status,
  };
}

export function buildWidgetSnapshot(
  visibleActivities: VisibleActivity[],
  currentTime: Date = new Date(),
  limit: number = WIDGET_ACTIVITY_LIMIT,
): WidgetSnapshot {
  const snapshotTime = currentTime.toISOString();

  return {
    version: WIDGET_SNAPSHOT_VERSION,
    generatedAt: snapshotTime,
    currentTime: snapshotTime,
    activities: visibleActivities.slice(0, limit).map(mapVisibleActivityToWidgetItem),
  };
}

export function serializeWidgetSnapshot(snapshot: WidgetSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseWidgetSnapshot(raw: string): WidgetSnapshot {
  const parsed: unknown = JSON.parse(raw);

  if (!isWidgetSnapshot(parsed)) {
    throw new Error('Invalid widget snapshot payload.');
  }

  return parsed;
}

function isWidgetSnapshot(value: unknown): value is WidgetSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const snapshot = value as Partial<WidgetSnapshot>;

  return (
    snapshot.version === WIDGET_SNAPSHOT_VERSION &&
    typeof snapshot.generatedAt === 'string' &&
    typeof snapshot.currentTime === 'string' &&
    Array.isArray(snapshot.activities) &&
    snapshot.activities.every(isWidgetActivityItem)
  );
}

function isWidgetActivityItem(value: unknown): value is WidgetActivityItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<WidgetActivityItem>;

  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.dueTime === 'string' &&
    typeof item.status === 'string'
  );
}
