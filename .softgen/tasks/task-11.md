---
title: Bug Category & Hotspots Analysis
status: done
priority: high
type: feature
tags: [analytics, categories, hotspots]
created_by: agent
created_at: 2026-04-09
position: 11
---

## Notes
Break down issues by category (UI/Validation/API/Backend) and identify top buggy features. Helps prioritize engineering efforts and identify weak areas.

## Checklist
- [x] Create BugCategoryBreakdown widget (pie/donut chart)
- [x] Implement category detection from labels
- [x] Create BugHotspots widget (top 5 features with most bugs)
- [x] Parse feature names from labels or titles
- [x] Add drill-down: click category/hotspot → filter issues
- [x] Add percentage and count for each category
- [x] Show trend arrows for categories