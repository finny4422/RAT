import type { Activity } from '@/types';
import { ActivityFrequency, ActivityResult, ActivityStatus } from '@/types';

import { parseTimeOnDate, toDateString, toDateStringFromIso } from './dateUtils';

const STATUS_SORT_ORDER: Record<ActivityStatus, number> = {
  [ActivityStatus.Missed]: 0,
  [ActivityStatus.DueSoon]: 1,
  [ActivityStatus.Pending]: 2,
};

/**
 * Calculates the live card status for an incomplete activity on the current cycle.
 *
 * **Inputs**
 * - `activity` — activity definition (`dueTime`, `warningMinutes`)
 * - `currentTime` — moment to evaluate (defaults to now)
 *
 * **Output**
 * - `ActivityStatus.Pending` — before warning time
 * - `ActivityStatus.DueSoon` — at/after warning time and before due time
 * - `ActivityStatus.Missed` — at/after due time
 *
 * **Algorithm**
 * 1. Build `dueAt` by applying `activity.dueTime` to the calendar day of `currentTime`.
 * 2. `warningAt = dueAt - warningMinutes`.
 * 3. If `currentTime < warningAt` → Pending.
 * 4. Else if `currentTime < dueAt` → DueSoon.
 * 5. Else → Missed.
 *
 * **Edge cases**
 * - Completed activities are not evaluated here; they are hidden from the Activities screen.
 * - `warningMinutes = 0` leaves no DueSoon window; status jumps from Pending to Missed at due time.
 * - At exactly `warningAt` → DueSoon. At exactly `dueAt` → Missed.
 *
 * **Example**
 * - due 20:00, warning 60 min, now 18:30 → Pending
 * - due 20:00, warning 60 min, now 19:30 → DueSoon
 * - due 20:00, warning 60 min, now 20:15 → Missed
 */
export function calculateStatus(
  activity: Activity,
  currentTime: Date = new Date(),
): ActivityStatus {
  const dueAt = parseTimeOnDate(activity.dueTime, currentTime);
  const warningAt = new Date(dueAt.getTime() - activity.warningMinutes * 60_000);

  if (currentTime < warningAt) {
    return ActivityStatus.Pending;
  }

  if (currentTime < dueAt) {
    return ActivityStatus.DueSoon;
  }

  return ActivityStatus.Missed;
}

/**
 * Determines whether an activity is scheduled for the given calendar day.
 *
 * **Inputs**
 * - `activity` — activity definition (`frequency` and schedule fields)
 * - `currentDate` — day to check (time-of-day is ignored)
 *
 * **Output**
 * - `true` when the activity should appear on that day
 * - `false` otherwise
 *
 * **Algorithm**
 * - Daily → always `true`
 * - Weekly → `currentDate.getDay() === activity.weekDay` (0 = Sunday … 6 = Saturday)
 * - Monthly → `currentDate.getDate() === activity.monthDay`
 * - One-time → `activity.oneTimeDate === toDateString(currentDate)`
 *
 * **Edge cases**
 * - Missing schedule fields (`weekDay`, `monthDay`, `oneTimeDate`) → `false`
 * - Monthly day 31 does not appear in shorter months (e.g. February)
 * - Future/past one-time activities return `false` except on their assigned date
 * - `active` is not checked here; callers filter inactive activities separately
 *
 * **Example**
 * - Weekly `weekDay: 0` (Sunday), checked on Sunday → `true`
 * - One-time `oneTimeDate: "2026-07-10"`, checked on 2026-07-09 → `false`
 */
export function isDueToday(activity: Activity, currentDate: Date = new Date()): boolean {
  const creationDate = toDateStringFromIso(activity.createdAt);

  switch (activity.frequency) {
    case ActivityFrequency.Daily:
      return toDateString(currentDate) >= creationDate;

    case ActivityFrequency.Weekly:
      return (
        activity.weekDay !== null &&
        currentDate.getDay() === activity.weekDay &&
        toDateString(currentDate) >= creationDate
      );

    case ActivityFrequency.Monthly:
      return (
        activity.monthDay !== null &&
        currentDate.getDate() === activity.monthDay &&
        toDateString(currentDate) >= creationDate
      );

    case ActivityFrequency.OneTime:
      return activity.oneTimeDate !== null && activity.oneTimeDate === toDateString(currentDate);

    default:
      return false;
  }
}

export type ActivityVisibilityContext = {
  hasLogForToday: boolean;
  hasCompletionLog: boolean;
};

/**
 * Applies the full visibility pipeline from BUSINESS_LOGIC.md.
 * Do not use isDueToday alone for display decisions.
 */
export function isActivityVisible(
  activity: Activity,
  currentDate: Date = new Date(),
  context: ActivityVisibilityContext,
): boolean {
  if (!activity.active) {
    return false;
  }

  if (activity.frequency === ActivityFrequency.OneTime) {
    if (activity.oneTimeDate === null) {
      return false;
    }

    if (toDateString(currentDate) < activity.oneTimeDate) {
      return false;
    }

    return !context.hasCompletionLog;
  }

  if (toDateString(currentDate) < toDateStringFromIso(activity.createdAt)) {
    return false;
  }

  if (!isDueToday(activity, currentDate)) {
    return false;
  }

  return !context.hasLogForToday;
}

/**
 * Determines whether an activity was scheduled for a specific cycle date.
 * Used by cycle-close backfill.
 */
export function isScheduledForCycleDate(activity: Activity, cycleDate: Date): boolean {
  if (activity.frequency === ActivityFrequency.OneTime) {
    return activity.oneTimeDate !== null && activity.oneTimeDate === toDateString(cycleDate);
  }

  return isDueToday(activity, cycleDate);
}

/**
 * Determines the completion result when a user checks the activity checkbox.
 *
 * **Inputs**
 * - `completedAt` — timestamp when the user completed the activity
 * - `dueAt` — due datetime for the current activity cycle
 *
 * **Output**
 * - `ActivityResult.OnTime` — completed at or before due time
 * - `ActivityResult.Late` — completed after due time
 *
 * **Algorithm**
 * - If `completedAt <= dueAt` → OnTime
 * - Else → Late
 *
 * **Edge cases**
 * - Completion exactly at due time → OnTime
 * - `ActivityResult.Missed` is never returned here; missed outcomes are created when a cycle ends without completion
 *
 * **Example**
 * - due 20:00, completed 19:45 → OnTime
 * - due 20:00, completed 20:01 → Late
 */
export function calculateCompletionResult(
  completedAt: Date,
  dueAt: Date,
): ActivityResult.OnTime | ActivityResult.Late {
  return completedAt <= dueAt ? ActivityResult.OnTime : ActivityResult.Late;
}

/**
 * Sorts activities using spec priority: Missed → Due Soon → Pending, then nearest due time.
 *
 * **Inputs**
 * - `activities` — list to sort
 * - `currentTime` — moment used for status and due-time comparison (defaults to now)
 *
 * **Output**
 * - New array sorted by priority; original array is not mutated
 *
 * **Algorithm**
 * 1. Compute `calculateStatus` for each activity at `currentTime`.
 * 2. Sort by status priority (Missed, DueSoon, Pending).
 * 3. Within the same status, sort by ascending due datetime on `currentTime`'s calendar day.
 *
 * **Edge cases**
 * - Empty array → empty array
 * - Ties on due time preserve relative order (stable sort via map index if needed — JS sort is stable in modern engines)
 *
 * **Example**
 * - A: Pending 21:00, B: Missed 18:00, C: DueSoon 20:00 → [B, C, A]
 */
export function sortActivities(
  activities: Activity[],
  currentTime: Date = new Date(),
): Activity[] {
  return [...activities]
    .map((activity, index) => ({ activity, index }))
    .sort((a, b) => {
      const statusA = calculateStatus(a.activity, currentTime);
      const statusB = calculateStatus(b.activity, currentTime);
      const statusDiff = STATUS_SORT_ORDER[statusA] - STATUS_SORT_ORDER[statusB];

      if (statusDiff !== 0) {
        return statusDiff;
      }

      const dueA = parseTimeOnDate(a.activity.dueTime, currentTime);
      const dueB = parseTimeOnDate(b.activity.dueTime, currentTime);
      const dueDiff = dueA.getTime() - dueB.getTime();

      if (dueDiff !== 0) {
        return dueDiff;
      }

      const titleDiff = a.activity.title.localeCompare(b.activity.title);
      return titleDiff !== 0 ? titleDiff : a.index - b.index;
    })
    .map(({ activity }) => activity);
}
