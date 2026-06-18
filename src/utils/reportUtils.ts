import type { ActivityLog, Report } from '@/types';
import { ActivityResult, ReportType } from '@/types';

export type GeneratedReport = Omit<Report, 'id'>;

const WEEKLY_REPORT_LOG_COUNT = 7;
const MONTHLY_REPORT_LOG_COUNT = 4;
const YEARLY_REPORT_LOG_COUNT = 12;

/**
 * Calculates the accountability score from cycle results.
 *
 * **Inputs**
 * - `onTime` — count of on-time completions
 * - `late` — count of late completions
 * - `missed` — count of missed cycles
 *
 * **Output**
 * - Score from 0 to 100
 *
 * **Algorithm**
 * `total = onTime + late + missed`
 * `score = ((onTime × 1) + (late × 0.5)) ÷ total × 100`
 *
 * **Edge cases**
 * - `total = 0` → returns `0` (no cycles to score)
 * - Missed cycles contribute to the denominator but add 0 points
 *
 * **Example**
 * - onTime 5, late 1, missed 1 → ((5 × 1) + (1 × 0.5)) ÷ 7 × 100 ≈ 78.57
 */
export function calculateScore(onTime: number, late: number, missed: number): number {
  const total = onTime + late + missed;

  if (total === 0) {
    return 0;
  }

  return ((onTime * 1 + late * 0.5) / total) * 100;
}

function aggregateLogsToReport(
  activityLogs: ActivityLog[],
  reportType: ReportType,
  expectedLogCount: number,
): GeneratedReport | null {
  if (activityLogs.length !== expectedLogCount) {
    return null;
  }

  const activityId = activityLogs[0]?.activityId;

  if (!activityId || !activityLogs.every((log) => log.activityId === activityId)) {
    throw new Error('All activity logs must belong to the same activity.');
  }

  const sortedLogs = [...activityLogs].sort((a, b) => a.date.localeCompare(b.date));
  const onTime = sortedLogs.filter((log) => log.result === ActivityResult.OnTime).length;
  const late = sortedLogs.filter((log) => log.result === ActivityResult.Late).length;
  const missed = sortedLogs.filter((log) => log.result === ActivityResult.Missed).length;

  return {
    activityId,
    reportType,
    startDate: sortedLogs[0].date,
    endDate: sortedLogs[sortedLogs.length - 1].date,
    onTime,
    late,
    missed,
    score: Math.round(calculateScore(onTime, late, missed) * 100) / 100,
  };
}

/**
 * Builds a weekly report for a daily activity from exactly 7 activity logs.
 *
 * **Inputs**
 * - `activityLogs` — 7 logs for one activity (one per daily cycle)
 *
 * **Output**
 * - `GeneratedReport` with `reportType: weekly`, counts, score, and date range
 * - `null` when log count is not exactly 7
 *
 * **Algorithm**
 * 1. Require exactly 7 logs for the same `activityId`.
 * 2. Sort logs by `date` ascending.
 * 3. Count `onTime`, `late`, and `missed` from `ActivityLog.result`.
 * 4. `startDate` = first log date, `endDate` = last log date.
 * 5. `score` = `calculateScore(onTime, late, missed)`.
 *
 * **Edge cases**
 * - Fewer or more than 7 logs → `null` (report not ready)
 * - Mixed `activityId` values → throws
 * - Reports are snapshots; this function does not persist or recalculate stored reports
 *
 * **Example**
 * - 7 daily logs: 5 ON_TIME, 1 LATE, 1 MISSED → weekly report with score ≈ 78.57
 */
export function generateWeeklyReport(activityLogs: ActivityLog[]): GeneratedReport | null {
  return aggregateLogsToReport(activityLogs, ReportType.Weekly, WEEKLY_REPORT_LOG_COUNT);
}

/**
 * Builds a monthly report for a weekly activity from exactly 4 activity logs.
 *
 * **Inputs**
 * - `activityLogs` — 4 logs for one activity (one per weekly cycle)
 *
 * **Output**
 * - `GeneratedReport` with `reportType: monthly`, counts, score, and date range
 * - `null` when log count is not exactly 4
 *
 * **Algorithm**
 * Same as `generateWeeklyReport`, but expects 4 logs and sets `reportType: monthly`.
 *
 * **Edge cases**
 * - Fewer or more than 4 logs → `null`
 * - Mixed `activityId` values → throws
 *
 * **Example**
 * - 4 weekly logs: 3 ON_TIME, 1 MISSED → monthly report with score = 75
 */
export function generateMonthlyReport(activityLogs: ActivityLog[]): GeneratedReport | null {
  return aggregateLogsToReport(activityLogs, ReportType.Monthly, MONTHLY_REPORT_LOG_COUNT);
}

/**
 * Builds a yearly report for a monthly activity from exactly 12 activity logs.
 */
export function generateYearlyReport(activityLogs: ActivityLog[]): GeneratedReport | null {
  return aggregateLogsToReport(activityLogs, ReportType.Yearly, YEARLY_REPORT_LOG_COUNT);
}
