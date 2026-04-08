---
title: Issue & Task Data Fetching
status: done
priority: high
type: feature
tags: [github, api]
created_by: agent
created_at: 2026-04-08
position: 2
---

## Notes
Direct GitHub API integration with Personal Access Token. Auto-fetches all user repositories on token entry. User selects repos via checkbox list. Issues fetched live from GitHub REST API with Pull Requests filtered out for accurate counts.

## Checklist
- [x] GitHub API integration with fetch()
- [x] Personal Access Token authentication
- [x] Auto-fetch all user repositories when token is added
- [x] Checkbox selection UI for repositories
- [x] Search/filter repository list
- [x] Fetch issues from selected repositories
- [x] Filter out Pull Requests from issue counts (bug fix)
- [x] Parse issue data (title, status, labels, assignees, dates)
- [x] Display in Jira-style table with accurate totals
- [x] Error handling for invalid tokens or repositories
- [x] Manual refresh functionality
- [x] Support multiple repositories simultaneously
- [x] Client-side data processing and filtering