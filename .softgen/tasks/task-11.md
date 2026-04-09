---
title: Bug Category & Hotspots Analysis
status: todo
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
- [ ] Create BugCategoryBreakdown widget (pie/donut chart)
- [ ] Implement category detection from labels
- [ ] Create BugHotspots widget (top 5 features with most bugs)
- [ ] Parse feature names from labels or titles
- [ ] Add drill-down: click category/hotspot → filter issues
- [ ] Add percentage and count for each category
- [ ] Show trend arrows for categories