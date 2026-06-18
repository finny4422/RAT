import { activityService } from '@/services/activity/activityService';

import { assertSnapshotGateOpen } from '@/services/appLifecycle/snapshotGate';
import { widgetBridge } from './widgetBridge';
import type { LifecycleSyncTrigger } from './widgetBridge';
import {
  buildWidgetSnapshot,
  WIDGET_ACTIVITY_LIMIT,
  type WidgetSnapshot,
} from './widgetSnapshot';

export interface WidgetService {
  buildWidgetSnapshot(currentTime?: Date): Promise<WidgetSnapshot>;
  refreshWidgetSnapshot(
    trigger: LifecycleSyncTrigger,
    currentTime?: Date,
  ): Promise<WidgetSnapshot>;
  getLastWidgetSnapshot(): WidgetSnapshot | null;
}

let lastWidgetSnapshot: WidgetSnapshot | null = null;

export const widgetService: WidgetService = {
  async buildWidgetSnapshot(currentTime: Date = new Date()) {
    const visible = await activityService.getTodaysVisibleActivities(currentTime);
    return buildWidgetSnapshot(visible, currentTime, WIDGET_ACTIVITY_LIMIT);
  },

  async refreshWidgetSnapshot(trigger: LifecycleSyncTrigger, currentTime: Date = new Date()) {
    assertSnapshotGateOpen();

    const snapshot = await widgetService.buildWidgetSnapshot(currentTime);
    lastWidgetSnapshot = snapshot;

    await widgetBridge.persistSnapshot(snapshot, trigger);
    await widgetBridge.reloadWidgetUI();

    return snapshot;
  },

  getLastWidgetSnapshot() {
    return lastWidgetSnapshot;
  },
};
