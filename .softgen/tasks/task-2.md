---
title: Issue & Task Data Fetching
status: done
priority: high
type: feature
tags: [github, api, sync]
created_by: agent
created_at: 2026-04-08
position: 2
---

## Notes
Integrate with GitHub REST API to fetch issues and tasks from connected repositories. Support pagination, rate limiting, and incremental syncing to minimize API calls. Cache data in Supabase for offline access and faster loading.

Authentication methods:
- GitHub OAuth (recommended)
- Personal Access Token (alternative)

## Checklist
- [x] Create /api/github/oauth-url route: generate OAuth authorization URL
- [x] Create /api/github/callback route: handle OAuth callback, exchange code for token
- [x] Add fetchGitHubRepositories in githubService: fetch user's repositories
- [x] Add fetchGitHubIssues in githubService: fetch issues from specific repository
- [x] Add syncRepositoryIssues in githubService: sync issues to Supabase
- [x] Update GitHubConnect component: working OAuth and PAT flows
- [x] Add error handling for API rate limits and authentication failures
- [x] Create useAutoSync hook: automatic background polling every 15 minutes
- [x] Update SyncStatus component: auto-sync toggle, next sync countdown
- [x] Add background sync scheduler (every 15 minutes for active repos)