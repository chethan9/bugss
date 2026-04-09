---
title: Token Storage & Auto-Connect
status: done
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
- [x] Add localStorage utility functions with Base64 encoding
- [x] Add "Remember me" checkbox to GitHub connection UI
- [x] Implement auto-connect on component mount
- [x] Add "Clear credentials" button in settings
- [x] Add connection status indicator (stored vs session)
- [x] Add security warning for stored tokens
- [x] Test auto-connect flow
- [x] Handle token expiration gracefully