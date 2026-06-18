import type { Activity, ActivityLog, Report } from '@/types';
import { ActivityFrequency, ReportType } from '@/types';

import { activityService } from '@/services/activity/activityService';
import { ActivityNotFoundError } from '@/services/activity/activityErrors';
import { activityLogService } from '@/services/activityLog/activityLogService';
import {
  generateMonthlyReport,
  generateWeeklyReport,
  generateYearlyReport,
} from '@/utils';
import type { GeneratedReport } from '@/utils/reportUtils';

import { ReportNotReadyError, ReportValidationError } from './reportErrors';
import { mapRowToReport } from './reportMapper';
import * as reportRepository from './reportRepository';

export type EligibleReportWindow = {
  activityId: string;
  logFrequency: ActivityFrequency;
  reportType: ReportType;
  requiredLogCount: number;
  availableLogCount: number;
  logs: ActivityLog[];
  isReady: boolean;
};

type ReportThreshold = {
  reportType: ReportType;
  requiredLogCount: number;
  generate: (logs: ActivityLog[]) => GeneratedReport | null;
};

const LOG_FREQUENCY_THRESHOLDS: Partial<Record<ActivityFrequency, ReportThreshold>> = {
  [ActivityFrequency.Daily]: {
    reportType: ReportType.Weekly,
    requiredLogCount: 7,
    generate: generateWeeklyReport,
  },
  [ActivityFrequency.Weekly]: {
    reportType: ReportType.Monthly,
    requiredLogCount: 4,
    generate: generateMonthlyReport,
  },
  [ActivityFrequency.Monthly]: {
    reportType: ReportType.Yearly,
    requiredLogCount: 12,
    generate: generateYearlyReport,
  },
};

export interface ReportService {
  listActivityIdsWithUnreportedLogs(): Promise<string[]>;
  findEligibleUnreportedLogs(activityId: string): Promise<EligibleReportWindow[]>;
  generateWeeklyReport(activityId: string): Promise<Report | null>;
  generateMonthlyReport(activityId: string): Promise<Report | null>;
  generateYearlyReport(activityId: string): Promise<Report | null>;
  generateAllEligibleReports(activityId: string): Promise<Report[]>;
  getReportsByActivityId(activityId: string): Promise<Report[]>;
  getReportHistory(): Promise<Report[]>;
  getReportById(id: string): Promise<Report | null>;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function loadActivity(activityId: string): Promise<Activity> {
  const activity = await activityService.getActivityById(activityId);

  if (!activity) {
    throw new ActivityNotFoundError(activityId);
  }

  if (activity.frequency === ActivityFrequency.OneTime) {
    throw new ReportValidationError('One-time activities do not generate reports.');
  }

  return activity;
}

function getThreshold(logFrequency: ActivityFrequency): ReportThreshold | null {
  return LOG_FREQUENCY_THRESHOLDS[logFrequency] ?? null;
}

async function buildEligibleWindow(
  activityId: string,
  logFrequency: ActivityFrequency,
): Promise<EligibleReportWindow | null> {
  const threshold = getThreshold(logFrequency);

  if (!threshold) {
    return null;
  }

  const logs = await activityLogService.getUnreportedLogs(
    activityId,
    logFrequency,
    threshold.requiredLogCount,
  );

  return {
    activityId,
    logFrequency,
    reportType: threshold.reportType,
    requiredLogCount: threshold.requiredLogCount,
    availableLogCount: logs.length,
    logs,
    isReady: logs.length === threshold.requiredLogCount,
  };
}

async function persistReportSnapshot(
  activity: Activity,
  logFrequency: ActivityFrequency,
  generated: GeneratedReport,
  logs: ActivityLog[],
): Promise<Report> {
  const reportId = generateId();
  const createdAt = nowIso();
  const logIds = logs.map((log) => log.id);

  const row = await reportRepository.markLogsAsReportedInTransaction(logIds, reportId, () =>
    reportRepository.insertReport({
      id: reportId,
      activityId: generated.activityId,
      activityTitle: activity.title,
      activityFrequency: logFrequency,
      reportType: generated.reportType,
      startDate: generated.startDate,
      endDate: generated.endDate,
      onTime: generated.onTime,
      late: generated.late,
      missed: generated.missed,
      score: generated.score,
      createdAt,
    }),
  );

  return mapRowToReport(row);
}

async function generateReportForLogFrequency(
  activityId: string,
  logFrequency: ActivityFrequency,
): Promise<Report | null> {
  const activity = await loadActivity(activityId);
  const window = await buildEligibleWindow(activityId, logFrequency);

  if (!window || !window.isReady) {
    return null;
  }

  const threshold = getThreshold(logFrequency);

  if (!threshold) {
    return null;
  }

  const generated = threshold.generate(window.logs);

  if (!generated) {
    return null;
  }

  return persistReportSnapshot(activity, logFrequency, generated, window.logs);
}

export const reportService: ReportService = {
  /**
   * Input: none
   * Output: activity ids that have at least one unreported log
   * Queries: SELECT DISTINCT activity_id FROM activity_logs WHERE report_id IS NULL
   */
  async listActivityIdsWithUnreportedLogs(): Promise<string[]> {
    return reportRepository.selectDistinctActivityIdsWithUnreportedLogs();
  },

  /**
   * Input: activityId
   * Output: eligible unreported windows per log-frequency epoch
   * Validation: activity exists; one-time excluded
   * Queries: DISTINCT unreported frequencies; SELECT unreported logs per frequency
   */
  async findEligibleUnreportedLogs(activityId: string): Promise<EligibleReportWindow[]> {
    await loadActivity(activityId);

    const frequencies = await reportRepository.selectDistinctUnreportedFrequencies(activityId);
    const windows: EligibleReportWindow[] = [];

    for (const logFrequency of frequencies) {
      const window = await buildEligibleWindow(activityId, logFrequency);

      if (window) {
        windows.push(window);
      }
    }

    return windows;
  },

  /**
   * Input: activityId
   * Output: persisted weekly Report or null if fewer than 7 unreported daily logs
   * Validation: uses log frequency `daily`
   * Queries: unreported logs + INSERT report + UPDATE logs (transaction)
   */
  async generateWeeklyReport(activityId: string): Promise<Report | null> {
    return generateReportForLogFrequency(activityId, ActivityFrequency.Daily);
  },

  /**
   * Input: activityId
   * Output: persisted monthly Report or null if fewer than 4 unreported weekly logs
   * Validation: uses log frequency `weekly`
   */
  async generateMonthlyReport(activityId: string): Promise<Report | null> {
    return generateReportForLogFrequency(activityId, ActivityFrequency.Weekly);
  },

  /**
   * Input: activityId
   * Output: persisted yearly Report or null if fewer than 12 unreported monthly logs
   * Validation: uses log frequency `monthly`
   */
  async generateYearlyReport(activityId: string): Promise<Report | null> {
    return generateReportForLogFrequency(activityId, ActivityFrequency.Monthly);
  },

  /**
   * Input: activityId
   * Output: all reports generated in this call (may be multiple epochs after edits)
   * Validation: loops until no eligible window is ready
   */
  async generateAllEligibleReports(activityId: string): Promise<Report[]> {
    await loadActivity(activityId);

    const createdReports: Report[] = [];
    let generated = true;

    while (generated) {
      generated = false;
      const frequencies = await reportRepository.selectDistinctUnreportedFrequencies(activityId);

      for (const logFrequency of frequencies) {
        const report = await generateReportForLogFrequency(activityId, logFrequency);

        if (report) {
          createdReports.push(report);
          generated = true;
        }
      }
    }

    return createdReports;
  },

  /**
   * Input: activityId
   * Output: reports for one activity, newest first
   * Queries: SELECT … WHERE activity_id = ? ORDER BY created_at DESC
   */
  async getReportsByActivityId(activityId: string): Promise<Report[]> {
    const rows = await reportRepository.selectReportsByActivityId(activityId);
    return rows.map(mapRowToReport);
  },

  /**
   * Input: none
   * Output: full report history, newest first
   * Queries: SELECT … ORDER BY created_at DESC
   */
  async getReportHistory(): Promise<Report[]> {
    const rows = await reportRepository.selectAllReports();
    return rows.map(mapRowToReport);
  },

  /**
   * Input: report id
   * Output: Report or null
   * Queries: SELECT … WHERE id = ?
   */
  async getReportById(id: string): Promise<Report | null> {
    const row = await reportRepository.selectReportById(id);
    return row ? mapRowToReport(row) : null;
  },
};
