import type { Report } from '@/types';

import { activityLogService } from '@/services/activityLog/activityLogService';
import type { CycleCloseResult } from '@/services/activityLog/activityLogService';
import { reportService } from '@/services/report/reportService';
import type { LifecycleSyncTrigger } from '@/services/widget/widgetBridge';
import { widgetService } from '@/services/widget/widgetService';
import type { WidgetSnapshot } from '@/services/widget/widgetSnapshot';

import { closeSnapshotGate, openSnapshotGate } from './snapshotGate';

export type LifecycleSyncStep = 'cycleClose' | 'reportGeneration' | 'widgetSnapshot';

export type LifecycleSyncStepError = {
  step: LifecycleSyncStep;
  error: Error;
  activityId?: string;
};

export type LifecycleSyncResult = {
  trigger: LifecycleSyncTrigger;
  currentTime: Date;
  cycleClose: CycleCloseResult | null;
  reportsGenerated: Report[];
  widgetSnapshot: WidgetSnapshot | null;
  widgetRefreshed: boolean;
  errors: LifecycleSyncStepError[];
};

/** @deprecated Use LifecycleSyncResult */
export type StartupResult = LifecycleSyncResult;

/** @deprecated Use LifecycleSyncStep */
export type StartupStep = LifecycleSyncStep;

/** @deprecated Use LifecycleSyncStepError */
export type StartupStepError = LifecycleSyncStepError;

export interface AppLifecycleService {
  runFullLifecycleSync(
    trigger?: LifecycleSyncTrigger,
    currentTime?: Date,
  ): Promise<LifecycleSyncResult>;
  runStartupSequence(currentTime?: Date): Promise<LifecycleSyncResult>;
  runCycleClose(currentTime?: Date): Promise<CycleCloseResult>;
  runReportGeneration(): Promise<Report[]>;
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

let lifecycleSyncInFlight: Promise<LifecycleSyncResult> | null = null;

async function performFullLifecycleSync(
  trigger: LifecycleSyncTrigger,
  currentTime: Date,
): Promise<LifecycleSyncResult> {
  const result: LifecycleSyncResult = {
    trigger,
    currentTime,
    cycleClose: null,
    reportsGenerated: [],
    widgetSnapshot: null,
    widgetRefreshed: false,
    errors: [],
  };

  try {
    result.cycleClose = await activityLogService.runCycleCloseBackfill(currentTime);
    openSnapshotGate();
  } catch (error) {
    result.errors.push({
      step: 'cycleClose',
      error: normalizeError(error),
    });
    return result;
  }

  const activityIds = await reportService.listActivityIdsWithUnreportedLogs();

  for (const activityId of activityIds) {
    try {
      const reports = await reportService.generateAllEligibleReports(activityId);
      result.reportsGenerated.push(...reports);
    } catch (error) {
      result.errors.push({
        step: 'reportGeneration',
        activityId,
        error: normalizeError(error),
      });
    }
  }

  try {
    result.widgetSnapshot = await widgetService.refreshWidgetSnapshot(trigger, currentTime);
    result.widgetRefreshed = true;
  } catch (error) {
    result.errors.push({
      step: 'widgetSnapshot',
      error: normalizeError(error),
    });
  } finally {
    closeSnapshotGate();
  }

  return result;
}

export const appLifecycleService: AppLifecycleService = {
  /**
   * Mini app launch: cycle close → report generation → widget snapshot.
   * Required for every widget refresh trigger.
   */
  async runFullLifecycleSync(
    trigger: LifecycleSyncTrigger = 'app_open',
    currentTime: Date = new Date(),
  ): Promise<LifecycleSyncResult> {
    if (lifecycleSyncInFlight) {
      await lifecycleSyncInFlight;
    }

    lifecycleSyncInFlight = performFullLifecycleSync(trigger, currentTime).finally(() => {
      lifecycleSyncInFlight = null;
    });

    return lifecycleSyncInFlight;
  },

  async runStartupSequence(currentTime: Date = new Date()): Promise<LifecycleSyncResult> {
    return appLifecycleService.runFullLifecycleSync('app_open', currentTime);
  },

  async runCycleClose(currentTime: Date = new Date()): Promise<CycleCloseResult> {
    return activityLogService.runCycleCloseBackfill(currentTime);
  },

  async runReportGeneration(): Promise<Report[]> {
    const activityIds = await reportService.listActivityIdsWithUnreportedLogs();
    const reports: Report[] = [];

    for (const activityId of activityIds) {
      const generated = await reportService.generateAllEligibleReports(activityId);
      reports.push(...generated);
    }

    return reports;
  },
};
