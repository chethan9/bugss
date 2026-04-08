---
title: Issue & Task Data Fetching
status: todo
priority: high
type: feature
tags: [github, api, data]
created_by: agent
created_at: 2026-04-08T10:20:16Z
position: 2
---

## Notes
Implement GitHub API integration to fetch all issues and tasks from connected repositories. Parse issue data including labels, assignees, state, milestone, created/updated dates. Store in Supabase for caching and offline access. Handle pagination and rate limiting.

## Checklist
- [ ] Extend GitHub service with fetchAllIssues(): handle pagination, parse labels/assignees/milestones, rate limit handling, error states
- [ ] Create Supabase schema: issues table (id, repo_id, github_issue_id, title, body, state, labels, assignees, milestone, created_at, updated_at, synced_at)
- [ ] Implement sync logic: fetch from GitHub, compare with stored data, update/insert changes, mark sync timestamp
- [ ] Create SyncButton component: manual sync trigger, last sync timestamp display, syncing progress indicator
- [ ] Add background sync scheduler (every 15 minutes for active repos)