# Routine Accountability Tracker - Project Specification

## Overview

Routine Accountability Tracker is a mobile application designed to track whether recurring and one-time activities are completed before their deadlines.

The application focuses on accountability rather than productivity management.

The core question the application answers is:

"Did I complete this activity before its deadline?"

The application should remain simple, lightweight, and easy to use.

All times and dates use the **device local timezone**.

---

# Product Goals

The application should:

* Track recurring routines
* Track one-time activities
* Measure completion performance
* Generate performance reports
* Provide quick access through a home screen widget

The application should not become a complex task management system.

---

# Non Goals

The application is NOT:

* A project management application
* A calendar application
* A note-taking application
* A reminder system
* A team collaboration platform
* A productivity suite

The focus is accountability only.

---

# Activity Types

The application supports four activity types.

Activities are **definitions**. There are no task instances. Each scheduled occurrence is tracked through **ActivityLog** records.

## Daily

Appears every day (from the activity creation date onward).

Example:

Exercise — Due: 8:00 PM

---

## Weekly

Appears only on its scheduled weekday (from the activity creation date onward).

Example:

Review Finances — Every Sunday — Due: 6:00 PM

Weekday convention: `0 = Sunday` through `6 = Saturday`.

---

## Monthly

Appears only on its scheduled day of month (from the activity creation date onward).

Example:

Budget Review — Every 30th — Due: 8:00 PM

If the scheduled day does not exist in a given month (e.g. day 31 in February), **no occurrence happens that month**. There is **no log and no score impact** for that month.

---

## One-Time

Appears on its assigned date and **remains visible until completed**.

Example:

Passport Renewal — Due: July 10, 2026

One-time activities are excluded from report generation.

---

# Application Structure

The application contains exactly three tabs.

## Tab 1 - Activities

Displays activities that require action today.

Only active, visible activities are shown.

Completed activities are hidden.

The screen should focus on items requiring action.

---

## Tab 2 - Create Activity

Used to create and edit activities.

Users can configure:

* Title
* Caption
* Frequency
* Due Time
* Warning Time (stored as minutes before due time)
* Scheduling information

Activity edits apply to **future cycles only**. Past ActivityLogs are never modified except when a one-time activity is completed after a MISSED cycle outcome (see Completion Logic).

---

## Tab 3 - Reports

Displays historical reports.

Reports are grouped by activity.

Reports are permanently stored.

---

# Activity Lifecycle

## Cycle Definition

A **cycle** is one scheduled occurrence of an activity on a specific calendar date.

Each cycle is identified by `(activity_id, date)`.

## Cycle End

A cycle ends at **local midnight** immediately following the scheduled due date.

Example: a daily activity due June 18 at 8:00 PM ends at June 19 12:00 AM local time.

## Cycle Close

When a cycle ends, the system must run **cycle close** processing:

1. Determine whether the activity was scheduled for that cycle date.
2. If scheduled and active, check whether an ActivityLog already exists for `(activity_id, date)`.
3. If **no log exists**, create an ActivityLog with result **MISSED** and `completed_at = null`.
4. If a log already exists (ON_TIME or LATE from user completion), do nothing.

Cycle close must be **idempotent**. The same cycle must never produce duplicate logs.

## Cycle Close Triggers

Cycle close runs:

* When the app is opened (backfill missed cycles from the last processed date through yesterday)
* At the local day boundary while the app is running

## Activity Created After Due Time

If an activity is created on its scheduled due day **after** its due time has already passed:

* The activity is shown immediately for that cycle.
* Its card status is **Missed** (red).
* The user may still complete it before midnight → result **LATE**.
* If not completed before midnight, cycle close creates a **MISSED** log.

## Activity Start Date

Recurring activities are visible only from their **creation date** onward. Past cycles are not backfilled before creation.

## One-Time Lifecycle

One-time activities follow special rules:

* Visible from the assigned date onward until the user completes them.
* A one-time activity **never disappears until completed**, even if missed.
* If not completed by cycle end, cycle close creates a **MISSED** log, but the card **remains visible**.
* The user may complete a one-time activity after the original due datetime until they check the box.
* Completing after the due datetime updates the outcome to **LATE** (replacing the MISSED result on the existing log).
* After completion (ON_TIME or LATE), the card is removed and `active` is set to `false`.

---

# Activity Visibility Rules

An activity appears on the Activities screen when **all** visibility conditions are met.

## Recurring Activities (Daily, Weekly, Monthly)

Visible when:

1. `active = true`
2. `isDueToday(activity, currentDate) = true`
3. No ActivityLog exists for `(activity_id, currentDate)`
4. `currentDate >= activity creation date`

## One-Time Activities

Visible when:

1. `active = true`
2. `currentDate >= oneTimeDate`
3. No completion log exists (no ActivityLog with result ON_TIME or LATE for this activity)

A one-time activity with a MISSED log remains visible until the user completes it.

## General Rules

* Future activities must not be displayed.
* Completed activities must not be displayed.
* Inactive activities must not be displayed.

## Visibility Helper

All screens and the widget must use the same visibility pipeline. Do not call `isDueToday` alone; apply the full visibility rules above.

---

# Activity Card Design

Each activity is displayed inside a rectangular card.

Card layout:

Left Side:

* Title
* Caption
* Due Time

Right Side:

* Checkbox

The entire card background changes color based on live card status.

---

# Status Model

The system uses two related but separate concepts.

## Live Card Statuses (UI only)

Three statuses apply to **incomplete** activities currently shown on the Activities screen:

### Pending

* Condition: current time is before warning time
* Color: White

### Due Soon

* Condition: current time is at or after warning time and before due time
* Color: Yellow

### Missed

* Condition: current time is at or after due time and the activity is not completed
* Color: Red
* Recurring: remains visible until local midnight (cycle end)
* One-time: remains visible until the user completes the activity

Warning time = due time minus `warning_minutes`.

If `warning_minutes = 0`, there is no Due Soon window.

## Stored Completion Outcomes (ActivityLog)

When a cycle resolves, the ActivityLog stores one of:

### ON_TIME

* User completed at or before the due datetime
* Card is removed from the Activities screen

### LATE

* User completed after the due datetime
* Card is removed from the Activities screen

### MISSED

* Cycle ended without completion
* Created by cycle close
* Recurring: card already removed at cycle end
* One-time: card remains until user completes late

**Important:** Live card status **Missed** (red UI) is not the same as stored result **MISSED** (history record). Card Missed means overdue and incomplete. Log MISSED means the cycle closed without completion.

---

# Activity Sorting Rules

Activities are sorted using the following priority.

Priority 1: **Missed** (red)

Priority 2: **Due Soon** (yellow)

Priority 3: **Pending** (white)

Within each priority group: **nearest due time first**.

If due times are equal, sort alphabetically by title.

This sorting logic is used everywhere in the application, including the widget.

The Activities screen and widget must evaluate status using the **same current time snapshot** per refresh so ordering stays consistent.

---

# Completion Logic

## When the Checkbox Is Pressed

1. Store completion timestamp.
2. Compare completion time with due datetime for the current cycle.
3. Determine result:
   * `completed_at <= due_at` → **ON_TIME**
   * `completed_at > due_at` → **LATE**
4. Create or update the ActivityLog for `(activity_id, date)`.
5. Remove the card from the Activities screen.
6. For one-time activities, set `active = false`.
7. Check whether a report threshold has been reached.
8. Refresh the widget.

## Completion Time Limits

### Recurring Activities

* Completion is allowed at any time before local midnight on the cycle date.
* Completion is **not allowed after midnight** once the cycle has closed.
* If the user completes after the due time but before midnight → **LATE**.

### One-Time Activities

* Completion is allowed any time until the user checks the box, even on days after the assigned date.
* Completing after the original due datetime → **LATE**.
* If a MISSED log already exists from cycle close, update that log to **LATE** with the completion timestamp.

## Duplicate Completion Prevention

Each cycle allows at most one ActivityLog per `(activity_id, date)`.

Duplicate checkbox presses must not create duplicate logs.

---

# Reporting System

Reports are generated automatically from ActivityLogs.

Reports are stored permanently.

Reports must **never be recalculated** after creation.

## Report Windows

Report windows are based on **occurrence counts**, not calendar weeks, months, or years.

| Activity Frequency | Logs Required | Report Type |
|--------------------|---------------|-------------|
| Daily              | 7             | Weekly      |
| Weekly             | 4             | Monthly     |
| Monthly            | 12            | Yearly      |

The report `start_date` and `end_date` are taken from the first and last log dates in the window.

Report windows begin from the **first due occurrence on or after the activity creation date**.

One-time activities do not generate reports.

## Report Generation Rules

1. Collect the next N consecutive ActivityLogs for the activity (N = 7, 4, or 12).
2. If fewer than N logs exist, no report is generated yet.
3. Generate the report snapshot with on-time, late, missed counts and score.
4. Persist the report permanently.
5. Mark the included logs as reported so they cannot be used again.

## Backfill

If the app was not opened for several days, cycle close backfill must create MISSED logs for all missed scheduled occurrences before evaluating report thresholds.

## Scoring System

Scoring values:

* On Time = 1 point
* Late = 0.5 points
* Missed = 0 points

Formula:

```
Score = ((On Time × 1) + (Late × 0.5)) ÷ Total Expected Activities × 100
```

Total Expected Activities = on_time + late + missed for the report window.

If total is zero, score is 0.

Scores are rounded to two decimal places at report creation.

---

# Widget Requirements

A home screen widget is a primary feature.

## Display

The widget displays the top **two** highest-priority visible activities.

The widget uses the **same visibility rules and sorting rules** as the Activities screen.

Widget items display:

* Title
* Due Time
* Checkbox

## Refresh

The widget auto-refreshes on a schedule, **every 15 minutes**, so status colors and ordering stay current without opening the app.

The widget also refreshes immediately after any completion action.

## Completion

Users can complete activities directly from the widget **without opening the app**.

Widget completion follows the same completion logic as the main application.

## Data Sharing

The widget reads from the same local database as the main app through shared storage appropriate to the platform.

---

# Data Persistence

All data should be stored locally.

Version 1 requirements:

* Offline only
* No user accounts
* No cloud synchronization
* No backend services

## Database Requirements

The schema must support all business rules above. Required design constraints:

### Activities

* Store activity definitions including frequency, schedule fields, due time, warning minutes, and active flag

### ActivityLogs

* One log per cycle per activity
* **Unique constraint on `(activity_id, date)`**
* Store `due_time` as it applied at cycle time (not rewritten when the activity is edited later)
* Store `completed_at`, `result` (ON_TIME, LATE, MISSED)
* Track which logs have been included in a report

### Reports

* Store immutable report snapshots
* Link each report to the ActivityLogs used to generate it
* Store `report_type`, date range, counts, and score
* Include `created_at` timestamp

### Cycle Tracking

* Track the last date cycle close was processed for each activity (or globally) to support backfill

### Data Integrity

* Enum validation for frequency, result, and report_type
* Activity edits do not rewrite historical logs (except one-time MISSED → LATE update on late completion)

---

# Version 1 Scope

Included:

* Activities screen
* Create activity screen
* Reports screen
* Activity tracking
* Completion tracking
* Cycle close and backfill
* Report generation
* Home screen widget with 15-minute auto-refresh

Excluded:

* Notifications
* Cloud sync
* Categories
* Priorities
* Tags
* Subtasks
* User accounts
* AI features

---

# Development Principles

Keep the application simple.

Prioritize accountability tracking.

Avoid unnecessary complexity.

Prefer maintainability over feature count.

Use pure utility functions for business logic.

Every feature should support the primary goal:

"Did I complete this activity before its deadline?"

---

# Maintenance Notes

* All date and time logic uses the device local timezone.
* Daylight saving time transitions must be tested.
* Activity frequency or schedule changes apply to future cycles only.
* Months with fewer days than the scheduled `month_day` produce no occurrence and no log.
