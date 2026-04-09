---
title: Analytics Infrastructure & Label Parsing
status: done
priority: urgent
type: feature
tags: [analytics, infrastructure]
created_by: agent
created_at: 2026-04-09
position: 6
---

## Notes
Core analytics engine with label parsing, severity detection, time calculations, and data aggregation. Provides foundational analytics for all widgets.

## Checklist
- [x] Create analyticsService.ts with core calculation functions
- [x] Implement severity label parser (critical/high/medium/low)
- [x] Implement category detector (bug/validation/ui/api/backend)
- [x] Calculate average resolution time overall and by severity
- [x] Parse module names from labels for stability tracking
- [x] Calculate trend data (created vs closed) over time range
- [x] Smart insights generator with threshold-based alerts
- [x] Severity distribution counter
- [x] Module stability calculator (closed/total percentage)
- [x] Track issue creation vs closure trend
- [x] Module stability score calculator