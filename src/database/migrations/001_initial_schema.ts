/**
 * Migration 001 — initial schema SQL.
 * Keep in sync with 001_initial_schema.sql
 *
 * Idempotent: all DDL uses IF NOT EXISTS.
 * Version tracking row is inserted by the migration runner, not this script.
 */
export function readMigration001(): string {
  return `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  applied_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id                TEXT    PRIMARY KEY NOT NULL,
  title             TEXT    NOT NULL,
  caption           TEXT    NOT NULL DEFAULT '',
  frequency         TEXT    NOT NULL
                    CHECK (frequency IN ('daily', 'weekly', 'monthly', 'one_time')),
  due_time          TEXT    NOT NULL
                    CHECK (due_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  warning_minutes   INTEGER NOT NULL DEFAULT 0
                    CHECK (warning_minutes >= 0),
  week_day          INTEGER NULL
                    CHECK (week_day IS NULL OR (week_day >= 0 AND week_day <= 6)),
  month_day         INTEGER NULL
                    CHECK (month_day IS NULL OR (month_day >= 1 AND month_day <= 31)),
  one_time_date     TEXT    NULL
                    CHECK (one_time_date IS NULL OR length(one_time_date) = 10),
  active            INTEGER NOT NULL DEFAULT 1
                    CHECK (active IN (0, 1)),
  created_at        TEXT    NOT NULL,
  updated_at        TEXT    NOT NULL,
  last_closed_date  TEXT    NULL
                    CHECK (last_closed_date IS NULL OR length(last_closed_date) = 10),
  CHECK (
    (frequency = 'daily')
    OR (frequency = 'weekly'  AND week_day IS NOT NULL)
    OR (frequency = 'monthly' AND month_day IS NOT NULL)
    OR (frequency = 'one_time' AND one_time_date IS NOT NULL)
  ),
  CHECK (
    (frequency = 'weekly'  AND month_day IS NULL AND one_time_date IS NULL)
    OR (frequency = 'monthly' AND week_day IS NULL AND one_time_date IS NULL)
    OR (frequency = 'daily'   AND week_day IS NULL AND month_day IS NULL AND one_time_date IS NULL)
    OR (frequency = 'one_time' AND week_day IS NULL AND month_day IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS reports (
  id                 TEXT    PRIMARY KEY NOT NULL,
  activity_id        TEXT    NOT NULL
                     REFERENCES activities(id) ON DELETE CASCADE,
  activity_title     TEXT    NOT NULL,
  activity_frequency TEXT    NOT NULL
                     CHECK (activity_frequency IN ('daily', 'weekly', 'monthly', 'one_time')),
  report_type        TEXT    NOT NULL
                     CHECK (report_type IN ('weekly', 'monthly', 'yearly')),
  start_date         TEXT    NOT NULL
                     CHECK (length(start_date) = 10),
  end_date           TEXT    NOT NULL
                     CHECK (length(end_date) = 10),
  on_time            INTEGER NOT NULL DEFAULT 0 CHECK (on_time >= 0),
  late               INTEGER NOT NULL DEFAULT 0 CHECK (late >= 0),
  missed             INTEGER NOT NULL DEFAULT 0 CHECK (missed >= 0),
  score              REAL    NOT NULL DEFAULT 0.0 CHECK (score >= 0.0 AND score <= 100.0),
  created_at         TEXT    NOT NULL,
  CHECK (start_date <= end_date),
  CHECK (on_time + late + missed > 0)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id           TEXT    PRIMARY KEY NOT NULL,
  activity_id  TEXT    NOT NULL
               REFERENCES activities(id) ON DELETE CASCADE,
  date         TEXT    NOT NULL
               CHECK (length(date) = 10),
  due_time     TEXT    NOT NULL
               CHECK (due_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  frequency    TEXT    NOT NULL
               CHECK (frequency IN ('daily', 'weekly', 'monthly', 'one_time')),
  completed_at TEXT    NULL,
  result       TEXT    NOT NULL
               CHECK (result IN ('ON_TIME', 'LATE', 'MISSED')),
  report_id    TEXT    NULL
               REFERENCES reports(id) ON DELETE SET NULL,
  created_at   TEXT    NOT NULL,
  UNIQUE (activity_id, date),
  CHECK (
    (result = 'MISSED' AND completed_at IS NULL)
    OR (result IN ('ON_TIME', 'LATE') AND completed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_activities_active
  ON activities (active) WHERE active = 1;

CREATE INDEX IF NOT EXISTS idx_activities_frequency
  ON activities (frequency);

CREATE INDEX IF NOT EXISTS idx_activities_last_closed_date
  ON activities (last_closed_date);

CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_date
  ON activity_logs (activity_id, date);

CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_result
  ON activity_logs (activity_id, result);

CREATE INDEX IF NOT EXISTS idx_activity_logs_unreported
  ON activity_logs (activity_id, frequency, date) WHERE report_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_reports_activity_created
  ON reports (activity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_report_id
  ON activity_logs (report_id) WHERE report_id IS NOT NULL;
`.trim();
}
