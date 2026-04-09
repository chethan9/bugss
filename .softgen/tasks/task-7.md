---
title: High-Impact Analytics Widgets
status: done
priority: high
type: feature
tags: [analytics, widgets, charts]
created_by: agent
created_at: 2026-04-09
position: 7
---

## Notes
Visual analytics widgets using Recharts. Displays severity distribution, resolution times, trends, and module stability with interactive charts and color-coded insights.

## Checklist
- [x] Create SmartInsights component (alert-style insights at top)
- [x] Create BugSeverityHeatmap (bar chart with color-coded severities)
- [x] Create AverageResolutionTime (KPI card with severity breakdown)
- [x] Create IssueTrendChart (line chart: created vs closed over time)
- [x] Create ModuleStabilityScore (progress bars for top 8 modules)
- [x] Install recharts and date-fns dependencies
- [x] Integrate analytics service calculations
- [x] Add responsive charts (Recharts + ResponsiveContainer)
- [x] Integrate widgets into dashboard layout
- [x] Add responsive grid layout for widgets (2 columns on desktop)