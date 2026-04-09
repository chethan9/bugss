---
title: Analytics Infrastructure & Label Parsing
status: in_progress
priority: urgent
type: feature
tags: [analytics, infrastructure]
created_by: agent
created_at: 2026-04-09
position: 6
---

## Notes
Build analytics infrastructure to extract insights from GitHub issues. Parse labels for severity, priority, categories, platforms, and root causes. Add date range filtering and calculation utilities.

## Checklist
- [ ] Create analyticsService.ts: calculation utilities for metrics
- [ ] Parse severity from labels (critical/high/medium/low)
- [ ] Parse priority from labels
- [ ] Parse categories (UI/Validation/API/Logic/Performance)
- [ ] Parse platforms (Android/iOS/Web/Admin Panel)
- [ ] Parse root causes from labels
- [ ] Add date range filter component (last 7/30/90 days, custom)
- [ ] Calculate average resolution time (overall + per severity)
- [ ] Calculate reopened issues percentage
- [ ] Track issue creation vs closure trend
- [ ] Module stability score calculator