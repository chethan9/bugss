---
title: Auto-Fetch Repositories on Connect
status: in_progress
priority: high
type: feature
tags: [github, ux, repos, workflow]
created_by: agent
created_at: 2026-04-09
position: 25
---

## Notes
Improve GitHub connection UX by auto-fetching user's repositories after token entry, then allowing selection from a searchable list instead of manual entry.

## Checklist
- [ ] Add GitHub API call to fetch user repositories
- [ ] Handle pagination for users with 100+ repos
- [ ] Create repository selection UI with checkboxes
- [ ] Add search/filter for repository list
- [ ] Show repo metadata (stars, description, language)
- [ ] Update connection flow to two-step process
- [ ] Persist selected repos in state
- [ ] Update token storage to include selected repos
- [ ] Test with various GitHub accounts