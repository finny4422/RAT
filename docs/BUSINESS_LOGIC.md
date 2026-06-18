# Business Logic Reference

Frozen business rules derived from [PROJECT_SPEC.md](./PROJECT_SPEC.md).  
Implemented as pure functions in `src/utils/`.

All date and time logic uses the **device local timezone**.

---

## Shared Conventions

| Convention | Rule |
|------------|------|
| Timezone | Device local timezone for all calculations |
| Time format | `dueTime` stored as `HH:MM` (24-hour) |
| Weekday | `weekDay` uses JavaScript convention: `0 = Sunday` … `6 = Saturday` |
| Date format | `YYYY-MM-DD` for `date`, `oneTimeDate`, report ranges |
| No task instances | Activities are definitions; history lives in `ActivityLog` |
| Cycle identity | One cycle = `(activity_id, date)` |
| Cycle end | Local midnight immediately after the scheduled due date |
| Card statuses | `Pending`, `DueSoon`, `Missed` — UI only, for incomplete activities |
| Log results | `ON_TIME`, `LATE`, `MISSED` — stored on `ActivityLog` |
| Status vs result | Card **Missed** (red) ≠ log **MISSED** (cycle closed without completion) |
| Warning time | `dueTime` minus `warningMinutes` (minutes before due) |
| Visibility | Never use `isDueToday` alone; apply full visibility rules (see §2) |
| Sorting snapshot | Activities screen and widget use the same `currentTime` per refresh |

---

## 1. Activity Visibility

**File:** `src/utils/activityUtils.ts` (future: `isActivityVisible`)

### Recurring Activities (Daily, Weekly, Monthly)

Visible when **all** are true:

1. `active = true`
2. `isDueToday(activity, currentDate) = true`
3. No `ActivityLog` exists for `(activity_id, currentDate)`
4. `currentDate >= activity.createdAt` (creation date)

### One-Time Activities

Visible when **all** are true:

1. `active = true`
2. `currentDate >= oneTimeDate`
3. No completion log exists (no log with result `ON_TIME` or `LATE` for this activity)

A one-time activity with a `MISSED` log **remains visible** until the user completes it.

### `isDueToday(activity, currentDate)` — scheduling helper

Used for recurring visibility and cycle-close scheduling. **Not sufficient alone for visibility.**

| Frequency | Rule |
|-----------|------|
| Daily | `currentDate >= creation date` |
| Weekly | `currentDate.getDay() === weekDay` and `currentDate >= creation date` |
| Monthly | `currentDate.getDate() === monthDay` and `currentDate >= creation date` |
| One-time | `oneTimeDate === toDateString(currentDate)` *(scheduling only; visibility uses rules above)* |

### Edge Cases

- Missing `weekDay`, `monthDay`, or `oneTimeDate` → not scheduled → `false`
- Monthly day 31 in February → no occurrence, no log, no score impact that month
- Future dates → not visible
- One-time past assigned date with `MISSED` log → still visible until completed

### Examples

| Activity | Date | Visible? |
|----------|------|----------|
| Daily, created today | today | yes (if no log today) |
| Daily, created today | yesterday | no (before creation) |
| Weekly Sunday | Sunday | yes |
| Weekly Sunday | Monday | no |
| One-time 2026-07-10 | 2026-07-10, no completion | yes |
| One-time 2026-07-10 | 2026-07-15, MISSED log | yes |
| One-time 2026-07-10 | any date, ON_TIME log | no |

---

## 2. `calculateStatus(activity, currentTime)`

**File:** `src/utils/activityUtils.ts`

| | |
|---|---|
| **Inputs** | `activity: Activity`, `currentTime: Date` |
| **Output** | `ActivityStatus` (`pending` \| `due_soon` \| `missed`) |

### Algorithm

1. `dueAt = parseTimeOnDate(activity.dueTime, currentTime)`
2. `warningAt = dueAt - activity.warningMinutes`
3. `currentTime < warningAt` → **Pending**
4. `currentTime < dueAt` → **Due Soon**
5. Otherwise → **Missed**

### Edge Cases

- Only for incomplete activities currently on the Activities screen
- Activity created after due time on same day → **Missed** immediately
- `warningMinutes = 0` → no Due Soon window
- At exactly `warningAt` → Due Soon; at exactly `dueAt` → Missed
- Recurring Missed card hidden at local midnight (cycle end)
- One-time Missed card stays until user completes

### Examples

| dueTime | warningMinutes | currentTime | Status |
|---------|----------------|-------------|--------|
| 20:00 | 60 | 18:30 | Pending |
| 20:00 | 60 | 19:30 | Due Soon |
| 20:00 | 60 | 20:15 | Missed |

---

## 3. Cycle Close

**File:** `src/utils/activityUtils.ts` (future: `closeCycle`)

| | |
|---|---|
| **Inputs** | `activity: Activity`, `cycleDate: Date` |
| **Output** | `ActivityLog` (MISSED) or `null` (no action) |

### Algorithm

1. Determine if activity was scheduled for `cycleDate` (`isDueToday` for recurring; one-time if `cycleDate === oneTimeDate`).
2. If not scheduled or `active = false` → return `null`.
3. If an `ActivityLog` already exists for `(activity_id, cycleDate)` → return `null` (idempotent).
4. Create log: `result = MISSED`, `completed_at = null`, `due_time` = activity due time at cycle time.

### Triggers

- App opened → backfill from last processed date through yesterday
- Local day boundary while app is running

### Edge Cases

- Must never create duplicate logs for the same cycle
- If user completed (ON_TIME/LATE) before midnight → log exists → no MISSED created
- One-time: MISSED log created at cycle end, but card **remains visible**
- Recurring: after cycle close, card no longer visible (not due today / log exists)
- Backfill creates MISSED for all missed scheduled days while app was closed

### Examples

| Scenario | Result |
|----------|--------|
| Daily due today, no completion, midnight passes | MISSED log created |
| Daily due today, user completed LATE at 21:00 | no action at midnight |
| One-time due today, no completion, midnight passes | MISSED log created, card stays |
| Monthly day 31 in February | no cycle, no log |

---

## 4. `calculateCompletionResult(completedAt, dueAt)`

**File:** `src/utils/activityUtils.ts`

| | |
|---|---|
| **Inputs** | `completedAt: Date`, `dueAt: Date` |
| **Output** | `ActivityResult.OnTime` \| `ActivityResult.Late` |

### Algorithm

- `completedAt <= dueAt` → **ON_TIME**
- `completedAt > dueAt` → **LATE**

### Completion Time Limits

| Type | Rule |
|------|------|
| Recurring | Allowed before local midnight on cycle date only |
| Recurring | Not allowed after cycle close (midnight) |
| One-time | Allowed any time until user checks the box |
| One-time | If MISSED log exists, update it to LATE with `completedAt` |

### Edge Cases

- Completion exactly at due time → ON_TIME
- MISSED is never returned from this function; created only by cycle close
- Duplicate checkbox presses must not create duplicate logs

### Examples

| completedAt | dueAt | Result |
|-------------|-------|--------|
| 19:45 | 20:00 | ON_TIME |
| 20:00 | 20:00 | ON_TIME |
| 20:01 | 20:00 | LATE |

---

## 5. `calculateScore(onTime, late, missed)`

**File:** `src/utils/reportUtils.ts`

| | |
|---|---|
| **Inputs** | `onTime: number`, `late: number`, `missed: number` |
| **Output** | `number` (0–100, rounded to 2 decimal places at report creation) |

### Algorithm

```
total = onTime + late + missed
score = ((onTime × 1) + (late × 0.5)) ÷ total × 100
round to 2 decimal places
```

### Edge Cases

- `total = 0` → score `0`
- Missed cycles count toward total but contribute 0 points

### Examples

| onTime | late | missed | Score |
|--------|------|--------|-------|
| 5 | 1 | 1 | 78.57 |
| 4 | 0 | 0 | 100.00 |
| 0 | 0 | 4 | 0.00 |

---

## 6. `sortActivities(activities, currentTime?)`

**File:** `src/utils/activityUtils.ts`

| | |
|---|---|
| **Inputs** | `activities: Activity[]`, `currentTime?: Date` (defaults to now) |
| **Output** | sorted `Activity[]` (new array) |

### Algorithm

1. Compute `calculateStatus` for each activity at `currentTime`.
2. Sort by priority: **Missed → Due Soon → Pending**.
3. Within same status: nearest due time ascending.
4. Tie on due time: sort alphabetically by title.

### Edge Cases

- Empty input → empty output
- Widget and Activities screen must share the same `currentTime` per refresh

### Example

| Activity | Status | Due | Order |
|----------|--------|-----|-------|
| A | Pending | 21:00 | 3rd |
| B | Missed | 18:00 | 1st |
| C | Due Soon | 20:00 | 2nd |

Result: `[B, C, A]`

---

## 7. Report Generation

**File:** `src/utils/reportUtils.ts`

Report windows are based on **occurrence counts**, not calendar periods.

| Activity Frequency | Logs Required | Report Type | Function |
|--------------------|---------------|-------------|----------|
| Daily | 7 | Weekly | `generateWeeklyReport` |
| Weekly | 4 | Monthly | `generateMonthlyReport` |
| Monthly | 12 | Yearly | `generateYearlyReport` |

One-time activities do **not** generate reports.

Windows begin from the **first due occurrence on or after activity creation date**.

### Shared Algorithm

1. Collect the next **N** unreported consecutive `ActivityLog` records for the activity.
2. If fewer than N logs exist → return `null` (report not ready).
3. Sort logs by `date` ascending.
4. Count `onTime`, `late`, `missed` from log results.
5. `startDate` = first log date, `endDate` = last log date.
6. `score = calculateScore(onTime, late, missed)`.
7. Persistence layer marks included logs as reported (not recalculated later).

### `generateWeeklyReport(activityLogs)`

- N = 7, `reportType = weekly`

### `generateMonthlyReport(activityLogs)`

- N = 4, `reportType = monthly`

### `generateYearlyReport(activityLogs)`

- N = 12, `reportType = yearly`

### Edge Cases

- Wrong log count → `null`
- Mixed `activityId` → error
- Logs already included in a prior report must be excluded
- Backfill must run before evaluating thresholds (app may have been closed)
- Output omits `id`; persistence layer assigns it

### Example

7 daily logs: 5 ON_TIME, 1 LATE, 1 MISSED → weekly report, score ≈ 78.57

---

## 8. Widget Logic

The widget applies the **same visibility pipeline and sorting** as the Activities screen.

| Rule | Value |
|------|-------|
| Items shown | Top 2 visible activities after sort |
| Auto-refresh | Every 15 minutes |
| Immediate refresh | After any completion |
| Completion | Allowed from widget without opening the app |
| Completion logic | Same as main app (§4) |
| Data source | Same local database via shared platform storage |

---

## Status & Result Quick Reference

| Concept | Values | Where used |
|---------|--------|------------|
| Card status | Pending, Due Soon, Missed | UI card background |
| Log result | ON_TIME, LATE, MISSED | ActivityLog.result |
| Card removed | ON_TIME or LATE completion | Activities screen |
| Card stays | One-time with MISSED log | Until user completes |

---

## Conflicts Resolved (vs prior BUSINESS_LOGIC.md)

| Prior rule | Updated rule (per PROJECT_SPEC) |
|------------|--------------------------------|
| `isDueToday` alone determines visibility | Full visibility pipeline required |
| One-time visible only on assigned date | Visible from assigned date until completed |
| Tie-breaker: preserve original order | Tie on due time → sort by title |
| Yearly report "not yet implemented" | `generateYearlyReport` defined (12 logs) |
| No cycle close documented | Cycle close and backfill fully specified |
| Score not rounded | Rounded to 2 decimal places at report creation |
| Reports from any 7/4 logs | Next N **unreported** consecutive logs only |
