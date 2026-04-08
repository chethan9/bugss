---
title: Dashboard UI & Filters
status: done
priority: medium
type: feature
tags: [ui, filters, dashboard]
created_by: agent
created_at: 2026-04-08
position: 3
---

## Notes
Build Jira-style dashboard with summary metrics, progress visualization, filtering system, and issue table. Add column sorting and detailed issue viewer modal.

## Checklist
- [x] Create DashboardMetrics: Jira-style horizontal stat cards with colored numbers
- [x] Create ProgressBar: color-coded segments for status breakdown
- [x] Create FilterPanel: multi-select filters for repos, labels, statuses
- [x] Create IssueTable: sortable columns (Date, Title, Status)
- [x] Add search functionality across titles and issue numbers
- [x] Implement column sorting with visual indicators (ascending/descending/none)
- [x] Create IssueDetailsModal: full description, comments, labels, assignees
- [x] Fetch live issue details and comments from GitHub API
- [x] Click-to-open modal from any issue row
- [x] Responsive layout with sidebar filters and main content area
- [x] Display issue counts matching GitHub exactly (Pull Requests filtered out)