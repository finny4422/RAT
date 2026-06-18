# Application Flow

Derived from [PROJECT_SPEC.md](./PROJECT_SPEC.md).

All times use the **device local timezone**.

---

## 1. App Launch

```
App opens
    ↓
Run cycle close backfill (last processed date → yesterday)
    ↓
For each active activity + each missed scheduled date:
    if no ActivityLog exists for (activity_id, date)
        create MISSED log (idempotent)
    ↓
Evaluate report thresholds for activities with new logs
    ↓
Refresh widget snapshot (top 2 visible activities)
```

---

## 2. Activity Creation

```
User creates activity (Create Activity tab)
    ↓
Store activity definition (frequency, schedule, due time, warning minutes)
    ↓
If created on scheduled due day AFTER due time has passed:
    show immediately with Missed (red) status
    user may still complete before midnight → LATE
    ↓
Activity visible from creation date onward (recurring)
    or from assigned date onward until completed (one-time)
```

---

## 3. Activities Screen — Display Pipeline

```
For each activity in database
    ↓
Apply visibility rules
    ↓
Recurring: active + isDueToday + no log for today + date >= createdAt
One-time:  active + date >= oneTimeDate + no ON_TIME/LATE log
    ↓
Calculate card status (Pending / Due Soon / Missed)
    ↓
Sort: Missed → Due Soon → Pending → nearest due time → title
    ↓
Render cards
```

---

## 4. Live Status During the Day

```
While activity is visible and incomplete
    ↓
Status engine recalculates:
    Pending   (before warning time)     → white
    Due Soon  (warning → due time)      → yellow
    Missed    (after due time)          → red
    ↓
Widget uses same visibility + sort (top 2)
Widget auto-refreshes every 15 minutes
```

---

## 5. User Completes Activity (Checkbox)

```
User checks checkbox (app or widget)
    ↓
Store completion timestamp
    ↓
Compare completed_at vs due_at for current cycle
    ↓
    ON_TIME  (completed_at <= due_at)
    LATE     (completed_at > due_at)
    ↓
Recurring:
    create ActivityLog for (activity_id, cycle_date)
    only if before local midnight on cycle date
    ↓
One-time:
    create log OR update existing MISSED log → LATE
    allowed any time until user checks the box
    ↓
Remove card from Activities screen
    ↓
One-time: set active = false
    ↓
Check report threshold (next N unreported logs)
    ↓
If threshold met → generate report → mark logs as reported
    ↓
Run full lifecycle sync (trigger: completion)
    ↓
Refresh Activities screen
```

---

## 6. Cycle Close (Midnight / Backfill)

```
Cycle end = local midnight after scheduled due date
    ↓
Was activity scheduled for that date?
    ↓ no → skip
    ↓ yes
Is activity active?
    ↓ no → skip
    ↓ yes
Does ActivityLog exist for (activity_id, date)?
    ↓ yes (ON_TIME or LATE) → skip (idempotent)
    ↓ no
Create ActivityLog: result = MISSED, completed_at = null
    ↓
Recurring:
    card no longer visible next day
    ↓
One-time:
    card REMAINS visible until user completes
    ↓
Evaluate report thresholds
    ↓
Full lifecycle sync (when triggered from background or app)
```

---

## 7. Report Generation

```
Collect next N unreported ActivityLogs for activity
    (N = 7 daily, 4 weekly, 12 monthly)
    ↓
Fewer than N logs → wait (no report yet)
    ↓
Exactly N logs → generate snapshot:
    count ON_TIME, LATE, MISSED
    calculate score (rounded to 2 decimals)
    start_date = first log, end_date = last log
    ↓
Persist report permanently (never recalculate)
    ↓
Mark included logs as reported
    ↓
Display in Reports tab (grouped by activity)
```

One-time activities do not enter this flow.

---

## 8. Widget Flow

**Frozen rule (V1):** Any widget refresh trigger MUST execute the full lifecycle sync in this order:

1. `runCycleCloseBackfill()`
2. `runReportGeneration()`
3. `refreshWidgetSnapshot()`

**Frozen invariant:** WidgetSnapshot must never be generated from stale lifecycle state. If cycle close fails, the snapshot gate stays closed and no snapshot is written.

Widget refresh is a **mini app launch**. The widget UI never owns correctness logic.

```
Trigger (app open | widget added | phone reboot | date changed | periodic sync | completion)
    ↓
AppLifecycleService.runFullLifecycleSync(trigger)
    ↓
Cycle close backfill
    ↓
Report generation
    ↓
Widget snapshot refresh (top 2 visible activities, same visibility + sort as Activities tab)
    ↓
WidgetBridge persists snapshot → native widget UI renders
```

Android V1 triggers:

| Trigger | When |
|---------|------|
| `app_open` | App launch after database bootstrap |
| `widget_added` | User adds home screen widget |
| `phone_reboot` | Device boot completed |
| `date_changed` | Local midnight rollover |
| `periodic_sync` | WorkManager (~15 minutes) |
| `completion` | Activity completed from app or widget |

Widget display fields: Title, Due Time, Checkbox, status background color.

User completes from widget (no app open required) → same completion logic as §5 → lifecycle sync with `completion` trigger.

---

## 9. Activity Edit

```
User edits activity (Create Activity tab)
    ↓
Changes apply to future cycles only
    ↓
Past ActivityLogs are NOT modified
    ↓
Exception: one-time MISSED → LATE update on late completion
```

---

## Flow Summary Diagram

```
Create Activity
    → Visible on schedule
    → Status: Pending / Due Soon / Missed
    → [Complete] → ON_TIME or LATE log → hide card → maybe report
    → [Midnight, no completion] → MISSED log → hide (recurring) or stay (one-time)
    → [One-time late complete] → update MISSED → LATE → hide → deactivate
    → Reports accumulate from logs → displayed permanently
    → Widget: full lifecycle sync → snapshot (top 2, periodic + triggers)
```
