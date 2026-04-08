---
title: GitHub Repository Connection Setup
status: todo
priority: urgent
type: feature
tags: [github, authentication, core]
created_by: agent
created_at: 2026-04-08T10:20:16Z
position: 1
---

## Notes
Implement GitHub repository connection with personal access token input. Users should be able to add multiple repositories. Store connection details in Supabase. Display connected repos in a list with disconnect option.

Requirements:
- Token input form with validation
- Repository selection (autocomplete from user's accessible repos)
- Multiple repository support
- Connection status indicator
- Secure token storage

## Checklist
- [ ] Create ConnectionForm component: token input field with secure masking, repository autocomplete, GitHub API validation, loading states
- [ ] Create RepositoryList component: display connected repos with name/owner/last sync time, disconnect button, sync status badge
- [ ] Create GitHub service (src/services/github.ts): fetchUserRepos(), validateToken(), fetchIssues() methods
- [ ] Create Supabase schema: repositories table (id, user_id, repo_name, repo_owner, github_token_encrypted, last_synced, created_at)
- [ ] Implement token encryption before storage
- [ ] Add connection management to index.tsx: empty state with "Connect Repository" CTA, connection form modal, repository list view