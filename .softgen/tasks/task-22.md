---
title: Token Storage & Auto-Connect
status: in_progress
priority: high
type: feature
tags: [auth, storage, security, ux]
created_by: agent
created_at: 2026-04-09
position: 22
---

## Notes
Implement secure token storage in localStorage with opt-in "Remember me" checkbox, auto-connect on page load, and clear credentials functionality.

## Checklist
- [ ] Add localStorage utility functions with Base64 encoding
- [ ] Add "Remember me" checkbox to GitHub connection UI
- [ ] Implement auto-connect on component mount
- [ ] Add "Clear credentials" button in settings
- [ ] Add connection status indicator (stored vs session)
- [ ] Add security warning for stored tokens
- [ ] Test auto-connect flow
- [ ] Handle token expiration gracefully