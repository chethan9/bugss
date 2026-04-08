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
- [x] Create Supabase schema: github_connections, repositories, issues tables with RLS
- [x] Create githubService.ts: connection management, repo fetching, issue syncing
- [x] Create GitHubConnect component: connection modal with OAuth and token options
- [x] Create RepositoryPicker component: select which repos to track
- [x] Create SyncStatus component: last sync time, manual refresh button
- [x] Update index.tsx: empty state for unconnected users, full dashboard when connected
- [x] Add connection status check on page load
- [x] Implement real data loading from Supabase