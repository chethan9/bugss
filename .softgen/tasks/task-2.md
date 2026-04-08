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
- [x] Create /api/github/store-token route: validate and store personal access tokens
- [x] Create /api/github/disconnect route: revoke connection and clear data
- [x] Add fetchGitHubRepositories in githubService: fetch user's repositories
- [x] Add fetchGitHubIssues in githubService: fetch issues from specific repository
- [x] Add syncRepositoryIssues in githubService: sync issues to Supabase
- [x] Update GitHubConnect component: working OAuth and PAT flows
- [x] Add error handling for API rate limits and authentication failures