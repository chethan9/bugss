---
title: Critical Decision Widgets - Phase 3A
status: done
priority: urgent
type: feature
tags: [analytics, critical, decision-making]
created_by: agent
created_at: 2026-04-09
position: 15
---

## Notes
Implemented critical decision-making widgets that provide instant go/no-go insights for release decisions, team performance tracking, and risk identification.

## Checklist
- [x] Create AtRiskRelease widget (% critical/high open, color-coded status)
- [x] Create AgingIssues widget (>7/30/90 days tracker, oldest issue)
- [x] Create CriticalUntouched widget (untouched critical bugs, 3+ day threshold)
- [x] Create BacklogGrowth widget (7-day created vs closed, trend indicator)
- [x] Create BugFixEfficiency widget (closed/created ratio, status scoring)
- [x] Add analytics calculations in analyticsService.ts
- [x] Integrate calculations with analytics memoization
- [x] Add Phase 3A widgets to WidgetSettings visibility controls
- [x] Calculate 7/14/30 day trends
- [x] Add widgets to dashboard with visibility toggles