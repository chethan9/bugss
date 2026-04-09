---
title: Date Range Filter & Reopened Issues Tracker
status: done
priority: urgent
type: feature
tags: [analytics, filters, quality]
created_by: agent
created_at: 2026-04-09
position: 10
---

## Notes
Add date range filtering for time-based analysis and track reopened issues as a quality metric. Essential for understanding team performance over specific periods.

## Checklist
- [x] Create DateRangeFilter component (presets: 7d, 30d, 90d, custom)
- [x] Integrate date filtering into analytics calculations
- [x] Create ReopenedIssuesTracker widget (percentage + trend)
- [x] Detect reopened issues from issue events/comments
- [x] Add date range state management
- [x] Update all analytics widgets to respect date range
- [x] Add visual indication of active date filter