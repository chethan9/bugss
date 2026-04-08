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
Direct GitHub API integration with Personal Access Token. No OAuth, no database caching. Live data fetched on-demand from GitHub REST API.

## Checklist
- [x] GitHub API integration with fetch()
- [x] Personal Access Token authentication
- [x] Fetch repositories from user account
- [x] Fetch issues from specific repository URLs
- [x] Parse issue data (title, status, labels, assignees, dates)
- [x] Display in Jira-style table
- [x] Error handling for invalid tokens or repositories
- [x] Manual refresh functionality
- [x] Support multiple repositories simultaneously
- [x] Client-side data processing and filtering