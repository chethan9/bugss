---
title: Dashboard UI with Issue Display
status: todo
priority: high
type: feature
tags: [ui, dashboard, components]
created_by: agent
created_at: 2026-04-08T10:20:16Z
position: 3
---

## Notes
Build the main dashboard interface displaying issues in card and list views. Each issue card shows title, status badge, labels, assignee avatar, created date. Support view toggle between cards and table. Implement issue detail modal with full description, comments preview, GitHub link.

## Checklist
- [ ] Create IssueCard component: issue title with truncation, status badge with color-coded states, label chips, assignee avatar with tooltip, created/updated timestamps, click handler for detail view
- [ ] Create IssueTable component: sortable columns (title, status, labels, assignee, updated), row click for details, compact view for large datasets
- [ ] Create IssueDetailModal: full issue title and description, label list, assignee info, milestone, created/updated dates, comment count, "View on GitHub" button
- [ ] Create ViewToggle component: card/list view switcher with icons
- [ ] Create dashboard layout in index.tsx: header with repo selector and sync button, view toggle, main content area with issue cards/table, empty state for no issues