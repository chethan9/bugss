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
Build authentication system with Supabase email/password login, then allow GitHub Personal Access Token connection. OAuth removed for simplicity.

## Checklist
- [x] Create Supabase schema: github_connections, repositories, issues tables with RLS
- [x] Create githubService.ts: connection management, repo fetching, issue syncing
- [x] Create AuthModal component: email/password signup and login
- [x] Create GitHubConnect component: Personal Access Token only (OAuth removed)
- [x] Create RepositoryPicker component: select which repos to track
- [x] Create SyncStatus component: last sync time, manual refresh button
- [x] Update index.tsx: auth check → GitHub connection → full dashboard flow
- [x] Add connection status check on page load
- [x] Implement real data loading from Supabase
- [x] Add Sign Out functionality