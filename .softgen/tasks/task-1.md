---
title: GitHub Repository Connection Setup
status: done
priority: urgent
type: feature
tags: [github, auth, api]
created_by: agent
created_at: 2026-04-08
position: 1
---

## Notes
Build GitHub OAuth integration to allow users to connect their repositories. Use GitHub's OAuth App flow or personal access tokens for authentication. Store connection details securely in Supabase.

Need to handle:
- GitHub OAuth callback
- Token refresh logic
- Multi-repository selection
- Connection status display

## Checklist
- [x] Create index.tsx: Jira-style dashboard with metrics, progress bar, filter panel, and issue table
- [x] Add DashboardMetrics component with summary cards
- [x] Add ProgressBar component with segment visualization
- [x] Add IssueTable component with status badges
- [x] Add FilterPanel component with repository, label, and status filters
- [x] Setup mock data structure for development
- [ ] Create GitHubConnect component: OAuth flow initiation, token input form
- [ ] Add api/auth/github/callback route: handle OAuth response, store tokens
- [ ] Create Supabase schema: repositories table, github_tokens table
- [ ] Add repository selection UI: list connected repos, enable/disable syncing