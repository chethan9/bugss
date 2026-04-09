---
title: Date Range Filter & Reopened Issues Tracker
status: in_progress
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
- [ ] Create DateRangeFilter component (presets: 7d, 30d, 90d, custom)
- [ ] Integrate date filtering into analytics calculations
- [ ] Create ReopenedIssuesTracker widget (percentage + trend)
- [ ] Detect reopened issues from issue events/comments
- [ ] Add date range state management
- [ ] Update all analytics widgets to respect date range
- [ ] Add visual indication of active date filter