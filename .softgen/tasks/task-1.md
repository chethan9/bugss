---
title: GitHub Repository Connection Setup
status: done
priority: urgent
type: feature
tags: [github, api]
created_by: agent
created_at: 2026-04-08
position: 1
---

## Notes
Simplified approach: No authentication, no database. Users paste GitHub token and repository URLs directly. All data stored in browser localStorage. Issues fetched live from GitHub API.

## Checklist
- [x] Remove Supabase authentication (no signup/login needed)
- [x] Token input modal with localStorage persistence
- [x] Add repository by URL/name (facebook/react format)
- [x] Remove repository with one click
- [x] Fetch issues from GitHub API directly
- [x] Display in Jira-style dashboard layout
- [x] Summary metrics (repos, issues, status counts)
- [x] Progress bar with completion percentage
- [x] Multi-select filters (repositories, labels, status)
- [x] Search functionality
- [x] Manual refresh button
- [x] Client-side only, no backend dependencies