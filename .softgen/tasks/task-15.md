---
title: Critical Decision Widgets - Phase 3A
status: in_progress
priority: urgent
type: feature
tags: [analytics, risk, decision-making]
created_by: agent
created_at: 2026-04-09
position: 15
---

## Notes
Implement critical decision-making widgets for release risk assessment, aging issues detection, and team performance metrics. These provide instant go/no-go decisions and highlight neglected areas.

## Checklist
- [ ] Create AtRiskRelease widget (% critical+high bugs open)
- [ ] Create AgingIssues widget (>7d, >30d buckets)
- [ ] Create CriticalBugsUntouched widget (no updates in X days)
- [ ] Create BacklogGrowthRate widget (created vs closed trend)
- [ ] Create BugFixEfficiency widget (closed/created ratio)
- [ ] Add analytics calculations to analyticsService
- [ ] Detect issue age from createdAt
- [ ] Detect last update timestamp (estimate)
- [ ] Calculate 7/14/30 day trends
- [ ] Add widgets to dashboard with visibility toggles