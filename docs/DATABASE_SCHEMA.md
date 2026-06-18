# Database Schema

Derived from [PROJECT_SPEC.md](./PROJECT_SPEC.md).

All timestamps stored in ISO 8601 format. All dates stored as `YYYY-MM-DD`.  
All times stored as `HH:MM` (24-hour).  
All date/time interpretation uses the **device local timezone**.

---

## Activities

Activity definitions. No task instances.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique identifier |
| `title` | TEXT | NOT NULL | Activity name |
| `caption` | TEXT | NOT NULL | Subtitle / description |
| `frequency` | TEXT | NOT NULL, CHECK | `daily`, `weekly`, `monthly`, `one_time` |
| `due_time` | TEXT | NOT NULL | Due time in `HH:MM` format |
| `warning_minutes` | INTEGER | NOT NULL | Minutes before due time for warning |
| `week_day` | INTEGER | NULL | 0–6 (Sunday–Saturday), required for weekly |
| `month_day` | INTEGER | NULL | 1–31, required for monthly |
| `one_time_date` | TEXT | NULL | `YYYY-MM-DD`, required for one-time |
| `active` | INTEGER | NOT NULL, DEFAULT 1 | 1 = active, 0 = inactive |
| `created_at` | TEXT | NOT NULL | ISO 8601 creation timestamp |
| `last_closed_date` | TEXT | NULL | Last date cycle close was processed (`YYYY-MM-DD`) |

### Notes

- Recurring activities visible from `created_at` date onward only.
- One-time activities set `active = 0` after completion.
- Activity edits do not rewrite historical logs (except one-time MISSED → LATE update).
- `due_time` on the activity is the current definition; cycle-time due time is stored on logs.

---

## ActivityLogs

One record per activity cycle. History of every scheduled occurrence.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique identifier |
| `activity_id` | TEXT | NOT NULL, FK → Activities | Parent activity |
| `date` | TEXT | NOT NULL | Cycle date (`YYYY-MM-DD`) |
| `due_time` | TEXT | NOT NULL | Due time as it applied for this cycle (`HH:MM`) |
| `completed_at` | TEXT | NULL | ISO 8601 completion timestamp; null for MISSED |
| `result` | TEXT | NOT NULL, CHECK | `ON_TIME`, `LATE`, `MISSED` |
| `report_id` | TEXT | NULL, FK → Reports | Set when log is included in a report |
| `created_at` | TEXT | NOT NULL | ISO 8601 log creation timestamp |

### Constraints

```
UNIQUE (activity_id, date)
```

- At most one log per activity per cycle date.
- Prevents duplicate completion logs.
- Cycle close is idempotent: no second MISSED if log exists.

### Result Values

| Result | Meaning | `completed_at` |
|--------|---------|----------------|
| `ON_TIME` | Completed at or before due datetime | set |
| `LATE` | Completed after due datetime | set |
| `MISSED` | Cycle closed without completion | null |

### Notes

- MISSED logs created by cycle close at local midnight (or backfill on app open).
- One-time MISSED logs may be updated to LATE when user completes late.
- Logs store `due_time` at cycle time; not rewritten when activity is edited.
- Unreported logs have `report_id = NULL`.

---

## Reports

Immutable report snapshots. Never recalculated after creation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique identifier |
| `activity_id` | TEXT | NOT NULL, FK → Activities | Parent activity |
| `report_type` | TEXT | NOT NULL, CHECK | `weekly`, `monthly`, `yearly` |
| `start_date` | TEXT | NOT NULL | First log date in window (`YYYY-MM-DD`) |
| `end_date` | TEXT | NOT NULL | Last log date in window (`YYYY-MM-DD`) |
| `on_time` | INTEGER | NOT NULL | Count of ON_TIME results |
| `late` | INTEGER | NOT NULL | Count of LATE results |
| `missed` | INTEGER | NOT NULL | Count of MISSED results |
| `score` | REAL | NOT NULL | 0–100, rounded to 2 decimal places |
| `created_at` | TEXT | NOT NULL | ISO 8601 report creation timestamp |

### Report Type Mapping

| Activity Frequency | Logs in Window | Report Type |
|--------------------|------------------|-------------|
| Daily | 7 consecutive unreported | `weekly` |
| Weekly | 4 consecutive unreported | `monthly` |
| Monthly | 12 consecutive unreported | `yearly` |

### Notes

- Report windows are **occurrence counts**, not calendar weeks/months/years.
- `start_date` / `end_date` derived from first and last log in the window.
- One-time activities do not generate reports.
- Included logs linked via `ActivityLogs.report_id`.

---

## Relationships

```
Activities 1 ──< ActivityLogs
Activities 1 ──< Reports
Reports    1 ──< ActivityLogs (via report_id)
```

---

## Cycle Close Support

Cycle close and backfill use `Activities.last_closed_date`:

1. On app open, for each active activity, process dates from `last_closed_date + 1` through yesterday.
2. For each date, if scheduled and no log exists → create MISSED.
3. Update `last_closed_date` to yesterday.

Alternative: a global `app_settings.last_closed_date` may be used instead of per-activity tracking. Per-activity is preferred for activities created mid-backfill period.

---

## Enum Reference

### `frequency`

| Value | Description |
|-------|-------------|
| `daily` | Every day from creation date |
| `weekly` | Scheduled weekday from creation date |
| `monthly` | Scheduled day of month from creation date |
| `one_time` | Single assigned date |

### `result`

| Value | Description |
|-------|-------------|
| `ON_TIME` | Completed on time |
| `LATE` | Completed late |
| `MISSED` | Cycle closed without completion |

### `report_type`

| Value | Description |
|-------|-------------|
| `weekly` | 7 daily cycles |
| `monthly` | 4 weekly cycles |
| `yearly` | 12 monthly cycles |

---

## Schema Changes from Prior Version

| Change | Reason |
|--------|--------|
| Added `Activities.last_closed_date` | Cycle close backfill support |
| Added `ActivityLogs.report_id` | Link logs to reports; prevent double-counting |
| Added `ActivityLogs.created_at` | Audit and ordering |
| Added `Reports.created_at` | Audit |
| Added `UNIQUE (activity_id, date)` | Duplicate completion prevention |
| Documented CHECK constraints | Enum validation per PROJECT_SPEC |
| Documented `due_time` on logs | Cycle-time due time preservation |
| Documented relationships | Report ↔ log linkage |

---

## Data Integrity Rules

1. One log per `(activity_id, date)`.
2. Activity edits do not modify past logs (except one-time MISSED → LATE).
3. Reports are immutable after creation.
4. Logs included in a report must have `report_id` set.
5. Monthly day 31 in short months produces no log (no row inserted).
