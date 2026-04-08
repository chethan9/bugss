---
title: Reports & Analytics Dashboard
status: todo
priority: low
type: feature
tags: [analytics, charts, reporting]
created_by: agent
created_at: 2026-04-08T10:20:16Z
position: 5
---

## Notes
Create analytics view with summary statistics and visualizations. Show issue distribution by status, labels, assignees. Timeline view of issue creation/closure rates. Export report as CSV. Simple charts using Chart.js or Recharts.

## Checklist
- [ ] Create StatsCards component: total issues, open count, closed count, average time to close, most active labels
- [ ] Create StatusChart component: pie/donut chart showing open vs closed vs in-progress distribution
- [ ] Create LabelDistribution component: horizontal bar chart of top 10 labels by issue count
- [ ] Create TimelineChart component: line chart showing issue creation and closure over time (last 30/90 days)
- [ ] Create reports page (src/pages/reports.tsx): stats cards at top, charts grid below, date range selector, export CSV button
- [ ] Add navigation to reports page from main dashboard