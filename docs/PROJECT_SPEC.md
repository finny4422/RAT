# Routine Accountability Tracker - Project Specification

## Overview

Routine Accountability Tracker is a mobile application designed to track whether recurring and one-time activities are completed before their deadlines.

The application focuses on accountability rather than productivity management.

The core question the application answers is:

"Did I complete this activity before its deadline?"

The application should remain simple, lightweight, and easy to use.

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

## Daily

Appears every day.

Example:

Exercise

Due:
8:00 PM

---

## Weekly

Appears only on its scheduled weekday.

Example:

Review Finances

Every Sunday

Due:
6:00 PM

---

## Monthly

Appears only on its scheduled day of month.

Example:

Budget Review

Every 30th

Due:
8:00 PM

---

## One-Time

Appears only on its assigned date.

Example:

Passport Renewal

Due:
July 10, 2026

---

# Application Structure

The application contains exactly three tabs.

## Tab 1 - Activities

Displays activities relevant for the current day.

Only active activities are shown.

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
* Warning Time
* Scheduling information

---

## Tab 3 - Reports

Displays historical reports.

Reports are grouped by activity.

Reports are permanently stored.

---

# Activity Visibility Rules

Only activities relevant for today are visible.

Examples:

Daily activities appear every day.

Weekly activities appear only on their scheduled weekday.

Monthly activities appear only on their scheduled date.

One-time activities appear only on their assigned date.

Future activities should not be displayed.

Completed activities should not be displayed.

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

The entire card background changes color based on status.

---

# Activity Statuses

Only four statuses exist.

## Pending

Condition:

Current time is before warning time.

Color:

White

---

## Due Soon

Condition:

Current time is after warning time but before due time.

Color:

Yellow

---

## Missed

Condition:

Current time is past due time and activity is not completed.

Color:

Red

Missed activities remain visible until the current activity cycle ends.

---

## Completed On Time

Condition:

Completion time is before or equal to due time.

The card is removed from the Activities screen.

History is stored.

---

## Completed Late

Condition:

Completion time is after due time.

The card is removed from the Activities screen.

History is stored.

---

# Activity Sorting Rules

Activities are sorted using the following priority.

Priority 1:
Missed

Priority 2:
Due Soon

Priority 3:
Pending

Within each priority group:

Nearest due time first.

This sorting logic is used everywhere in the application.

---

# Completion Logic

When the checkbox is pressed:

1. Store completion timestamp.
2. Compare completion time with due time.
3. Determine result.
4. Store history record.
5. Remove card from Activities screen.
6. Refresh widget.

---

# Reporting System

Reports are generated automatically.

Reports are stored permanently.

Reports should never be recalculated after creation.

---

## Daily Activities

Generate a weekly report after 7 daily cycles.

---

## Weekly Activities

Generate a monthly report after 4 weekly cycles.

---

## Monthly Activities

Generate a yearly report after 12 monthly cycles.

---

# Scoring System

Scoring values:

On Time = 1 point

Late = 0.5 points

Missed = 0 points

Formula:

Score =
((On Time × 1) + (Late × 0.5))
÷ Total Expected Activities
× 100

---

# Widget Requirements

A home screen widget is a primary feature.

The widget displays the highest-priority active activities.

Initially:

Show top two activities.

The widget uses the same sorting rules as the Activities screen.

Widget items display:

* Title
* Due Time
* Checkbox

Users can complete activities directly from the widget.

Widget completion follows the same completion logic as the main application.

---

# Data Persistence

All data should be stored locally.

Version 1 requirements:

* Offline only
* No user accounts
* No cloud synchronization
* No backend services

---

# Version 1 Scope

Included:

* Activities screen
* Create activity screen
* Reports screen
* Activity tracking
* Completion tracking
* Report generation
* Home screen widget

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

Every feature should support the primary goal:

"Did I complete this activity before its deadline?"
