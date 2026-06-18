# Phase 2 — SQLite Database Design

Source of truth: [PROJECT_SPEC.md](./PROJECT_SPEC.md), [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md), [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md), [APP_FLOW.md](./APP_FLOW.md).

Implementation SQL: `src/database/migrations/001_initial_schema.sql`

---

## 1. Database Initialization Strategy

### Database file

| Setting | Value |
|---------|-------|
| Engine | SQLite via `expo-sqlite` |
| File name | `routine_tracker.db` |
| Location | App sandbox (main app); App Group shared container (widget extension) |
| Encoding | UTF-8 text for all string fields |

### Startup sequence

```
1. Open (or create) routine_tracker.db
2. PRAGMA foreign_keys = ON
3. PRAGMA journal_mode = WAL        -- concurrent reads (widget + app)
4. Query schema_migrations for applied versions
5. Run pending migrations in ascending version order (transaction per migration)
6. Return database handle to callers
```

### Singleton access

- One shared connection per process (main app or widget extension).
- Widget extension opens the **same database file path** via platform shared storage.
- Callers obtain the handle through `getDatabase()` after `initializeDatabase()`.

### First launch

Migration `001_initial_schema` creates all tables and indexes. No seed data required.

---

## 2. Migration Strategy

### Version tracking

Table `schema_migrations`:

| Column | Purpose |
|--------|---------|
| `version` | Integer migration version (PRIMARY KEY) |
| `name` | Descriptive name (e.g. `initial_schema`) |
| `applied_at` | ISO 8601 timestamp when applied |

### Rules

1. Migrations are **sequential integers** starting at 1.
2. Each migration runs inside a **single transaction**; rollback on failure.
3. Applied migrations are **never re-run**.
4. New schema changes = new numbered SQL file (`002_*.sql`).
5. `DATABASE_VERSION` constant in code matches highest migration version.

### Current migrations

| Version | File | Description |
|---------|------|-------------|
| 1 | `001_initial_schema.sql` | Activities, activity_logs, reports, indexes |

---

## 3. Table Definitions

### 3.1 `schema_migrations`

**Purpose:** Track which migrations have been applied.

| Field | Type | Constraints |
|-------|------|-------------|
| `version` | INTEGER | PRIMARY KEY |
| `name` | TEXT | NOT NULL |
| `applied_at` | TEXT | NOT NULL |

**Relationships:** None.

---

### 3.2 `activities`

**Purpose:** Store activity definitions. No task instances — one row per activity.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PK | UUID |
| `title` | TEXT | NOT NULL | Display name |
| `caption` | TEXT | NOT NULL | Subtitle |
| `frequency` | TEXT | NOT NULL, CHECK | `daily`, `weekly`, `monthly`, `one_time` |
| `due_time` | TEXT | NOT NULL, CHECK | `HH:MM` 24-hour |
| `warning_minutes` | INTEGER | NOT NULL, ≥ 0 | Minutes before due for Due Soon |
| `week_day` | INTEGER | NULL, 0–6 | Required for weekly |
| `month_day` | INTEGER | NULL, 1–31 | Required for monthly |
| `one_time_date` | TEXT | NULL | `YYYY-MM-DD`, required for one-time |
| `active` | INTEGER | NOT NULL, 0\|1 | 1 = visible candidate |
| `created_at` | TEXT | NOT NULL | ISO 8601; creation date derived for visibility |
| `updated_at` | TEXT | NOT NULL | ISO 8601; set on every edit |
| `last_closed_date` | TEXT | NULL | Last cycle-close processed date (`YYYY-MM-DD`) |

**CHECK constraints:**

- Frequency-specific fields required/null as documented in SQL.
- Invalid frequency/schedule combinations rejected at insert.

**Relationships:**

- 1 → many `activity_logs`
- 1 → many `reports`

---

### 3.3 `activity_logs`

**Purpose:** One row per activity cycle. Stores completion history and MISSED outcomes.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PK | UUID |
| `activity_id` | TEXT | NOT NULL, FK | → `activities.id` CASCADE |
| `date` | TEXT | NOT NULL | Cycle date `YYYY-MM-DD` |
| `due_time` | TEXT | NOT NULL | Due time frozen at cycle time |
| `frequency` | TEXT | NOT NULL, CHECK | Frequency frozen at cycle time |
| `completed_at` | TEXT | NULL | ISO 8601; NULL when MISSED |
| `result` | TEXT | NOT NULL, CHECK | `ON_TIME`, `LATE`, `MISSED` |
| `report_id` | TEXT | NULL, FK | → `reports.id` SET NULL |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

**Unique constraint:** `(activity_id, date)` — one log per cycle.

**CHECK constraints:**

- `MISSED` ↔ `completed_at IS NULL`
- `ON_TIME` / `LATE` ↔ `completed_at IS NOT NULL`

**Relationships:**

- many → 1 `activities`
- many → 1 `reports` (optional, set when included in report)

---

### 3.4 `reports`

**Purpose:** Immutable report snapshots. Never updated after creation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PK | UUID |
| `activity_id` | TEXT | NOT NULL, FK | → `activities.id` CASCADE |
| `activity_title` | TEXT | NOT NULL | Title snapshot at report creation |
| `activity_frequency` | TEXT | NOT NULL, CHECK | Frequency snapshot at report creation |
| `report_type` | TEXT | NOT NULL, CHECK | `weekly`, `monthly`, `yearly` |
| `start_date` | TEXT | NOT NULL | First log date in window |
| `end_date` | TEXT | NOT NULL | Last log date in window |
| `on_time` | INTEGER | NOT NULL, ≥ 0 | ON_TIME count |
| `late` | INTEGER | NOT NULL, ≥ 0 | LATE count |
| `missed` | INTEGER | NOT NULL, ≥ 0 | MISSED count |
| `score` | REAL | NOT NULL, 0–100 | Rounded to 2 decimals |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

**CHECK constraints:**

- `start_date <= end_date`
- `on_time + late + missed > 0`

**Relationships:**

- many → 1 `activities`
- 1 → many `activity_logs` (via `activity_logs.report_id`)

---

## 4. Index Definitions

| Index | Columns | Partial | Optimizes |
|-------|---------|---------|-----------|
| `idx_activities_active` | `active` | `WHERE active = 1` | Load active activities for visibility pipeline |
| `idx_activities_frequency` | `frequency` | — | Cycle-close backfill filtered by type |
| `idx_activities_last_closed_date` | `last_closed_date` | — | Find activities needing backfill |
| `idx_activity_logs_activity_date` | `activity_id, date` | — | Recurring: "log exists for today?" lookup |
| `idx_activity_logs_activity_result` | `activity_id, result` | — | One-time: "completion log exists?" |
| `idx_activity_logs_unreported` | `activity_id, frequency, date` | `WHERE report_id IS NULL` | Report gen: next N unreported logs per frequency epoch |
| `idx_reports_activity_created` | `activity_id, created_at DESC` | — | Reports screen grouped by activity |
| `idx_activity_logs_report_id` | `report_id` | `WHERE report_id IS NOT NULL` | Audit logs in a report |

The unique constraint on `(activity_id, date)` also serves as an index for cycle-close idempotency checks.

---

## 5. Foreign Key Definitions

| Child | Column | Parent | On Delete |
|-------|--------|--------|-----------|
| `activity_logs.activity_id` | → | `activities.id` | CASCADE |
| `activity_logs.report_id` | → | `reports.id` | SET NULL |
| `reports.activity_id` | → | `activities.id` | CASCADE |

`PRAGMA foreign_keys = ON` is required on every connection.

**Rationale:**

- Deleting an activity removes its logs and reports (user-initiated delete in future).
- Deleting a report clears `report_id` on logs rather than deleting history.

---

## 6. Data Integrity Constraints

| Rule | Enforcement |
|------|-------------|
| One log per cycle | `UNIQUE (activity_id, date)` |
| Valid frequency | CHECK on `activities.frequency` |
| Valid result | CHECK on `activity_logs.result` |
| Result ↔ completed_at | CHECK on `activity_logs` |
| Valid report type | CHECK on `reports.report_type` |
| Schedule field consistency | CHECK on `activities` (frequency-specific) |
| Score range | CHECK `score BETWEEN 0 AND 100` |
| Report must have logs | CHECK `on_time + late + missed > 0` |
| No duplicate migration | `schema_migrations.version` PRIMARY KEY |
| Idempotent cycle close | UNIQUE prevents duplicate MISSED insert |
| Logs not double-reported | Service sets `report_id`; partial index on unreported |

**Application-layer rules** (not DB-enforced):

- Monthly day 31 in February → no row inserted (scheduling logic)
- One-time MISSED → LATE update (single row UPDATE)
- Report immutability (no UPDATE on reports after insert)

---

## 7. Cycle-Close Support Strategy

### Per-activity cursor: `last_closed_date`

Each activity tracks the last calendar date for which cycle close has run.

### Backfill algorithm (app open)

```
yesterday = local date - 1 day

FOR each activity WHERE active = 1:
  start = last_closed_date + 1 day
         OR date(created_at) if last_closed_date IS NULL
  FOR each date D from start to yesterday:
    IF activity was scheduled on D (business logic):
      INSERT activity_log (MISSED) ON CONFLICT DO NOTHING
  SET last_closed_date = yesterday
```

### Idempotency

- `INSERT ... ON CONFLICT (activity_id, date) DO NOTHING` for MISSED creation.
- If user already completed (ON_TIME/LATE), unique constraint prevents MISSED.

### Midnight while running

Same logic for `yesterday = today - 1` when day boundary detected.

### One-time special case

- MISSED log created at cycle close on assigned date.
- Card stays visible (visibility rule checks for ON_TIME/LATE, not MISSED).
- `last_closed_date` still updated; no further cycles scheduled.

---

## 8. Report Linkage Strategy

### Link model

`activity_logs.report_id` → `reports.id`

### Report creation flow

```
1. SELECT next N rows FROM activity_logs
   WHERE activity_id = ? AND report_id IS NULL
   ORDER BY date ASC
   LIMIT N

2. IF count < N → abort (not ready)

3. INSERT INTO reports (...)

4. UPDATE activity_logs SET report_id = ?
   WHERE id IN (...)

5. COMMIT
```

All steps in one transaction.

### Why not a junction table?

A log belongs to at most one report. `report_id` on the log is sufficient and simpler.

### Immutability

Reports are INSERT-only. Logs get `report_id` set once. Never recalculated.

### Report generation query (per frequency epoch)

```sql
SELECT * FROM activity_logs
WHERE activity_id = ?
  AND report_id IS NULL
  AND frequency = ?
ORDER BY date ASC
LIMIT N;
```

When `frequency` changes on an activity, drain unreported logs for each frozen `frequency` value independently before starting the new epoch.

---

## 8.1 Activity Edit & Historical Correctness

### Should `activities` include `updated_at`?

**Yes.** Set on every edit. Supports audit, UI "last modified", and debugging. Does not affect scoring.

### Edit impact analysis

| Field changed | Scores accurate? | Display accurate? | Schema support |
|---------------|------------------|-------------------|----------------|
| `title` | Yes (scores from logs) | Without snapshot: **No** | `reports.activity_title` |
| `due_time` | Yes | Yes (logs store cycle `due_time`) | `activity_logs.due_time` *(existing)* |
| `frequency` | Yes for closed reports | Without snapshot: **No** | `activity_logs.frequency` + `reports.activity_frequency` |

### Minimum additions applied

1. `activities.updated_at` — edit tracking
2. `activity_logs.frequency` — freeze scheduling epoch per cycle
3. `reports.activity_title` — title at report time
4. `reports.activity_frequency` — frequency at report time

---

## 9. Validation Against Business Rules

### Daily activities

| Requirement | Supported by |
|-------------|--------------|
| Visible every day from creation | `activities.created_at`, no log for today |
| Cycle close creates MISSED | `UNIQUE (activity_id, date)` + insert |
| 7 logs → weekly report | `idx_activity_logs_unreported` + `report_type = weekly` |
| Backfill while app closed | `last_closed_date` cursor |

### Weekly activities

| Requirement | Supported by |
|-------------|--------------|
| `week_day` schedule | `activities.week_day` CHECK |
| Visible only on weekday | App logic + log lookup via index |
| 4 logs → monthly report | Unreported log query LIMIT 4 |

### Monthly activities

| Requirement | Supported by |
|-------------|--------------|
| `month_day` schedule | `activities.month_day` CHECK |
| Feb 31 skipped (no log) | App scheduling; no row inserted |
| 12 logs → yearly report | Unreported log query LIMIT 12 |

### One-time activities

| Requirement | Supported by |
|-------------|--------------|
| `one_time_date` schedule | `activities.one_time_date` CHECK |
| Stays visible after MISSED | Visibility checks ON_TIME/LATE only |
| MISSED → LATE update | UPDATE single row by `(activity_id, date)` |
| Deactivate on complete | `activities.active = 0` |
| No reports | No report rows for `frequency = one_time` |

### Cycle close

| Requirement | Supported by |
|-------------|--------------|
| Idempotent MISSED | UNIQUE + ON CONFLICT DO NOTHING |
| Per-activity backfill | `last_closed_date` |
| due_time frozen | `activity_logs.due_time` |

### Report generation

| Requirement | Supported by |
|-------------|--------------|
| Occurrence counts | Query LIMIT N unreported |
| No double-counting | `report_id IS NULL` partial index |
| Immutable snapshots | INSERT-only reports |
| Log linkage | `activity_logs.report_id` FK |

### Widget queries

| Query | SQL pattern |
|-------|---------------|
| Load candidates | `SELECT * FROM activities WHERE active = 1` |
| Recurring log check | `SELECT 1 FROM activity_logs WHERE activity_id = ? AND date = ?` |
| One-time completion check | `SELECT 1 FROM activity_logs WHERE activity_id = ? AND result IN ('ON_TIME','LATE')` |
| Top 2 after sort | App-layer sort; DB returns active activities + today's logs |

Widget uses WAL mode for concurrent read access while app may write.

---

## 10. Sufficiency Verdict

**Is this database schema sufficient to support all business rules without future redesign?**

**Yes**, for Version 1 scope — including activity edits after logs exist.

Snapshot columns on reports and frozen `frequency`/`due_time` on logs ensure historical scores and display remain correct without redesign.

**Acceptable future migrations (not redesign):**

- Soft-delete for activities
- Additional report metadata
- App settings table if global config needed

These would be additive migrations (`002_*`), not structural redesign.
