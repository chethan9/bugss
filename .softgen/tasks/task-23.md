---
title: Table Header Filters
status: done
priority: high
type: feature
tags: [table, filters, ux, ui]
created_by: agent
created_at: 2026-04-09
position: 23
---

## Notes
Add inline column filters directly in table headers for faster, Excel-like filtering experience without opening sidebar modal.

## Checklist
- [x] Add text search input in Title column header
- [x] Add status dropdown filter in Status column
- [x] Add severity dropdown filter in Severity column
- [x] Add assignee searchable dropdown
- [x] Add labels multi-select filter
- [x] Implement debounced search for text inputs
- [x] Add "Clear" icon per filter
- [x] Add "Clear all filters" button
- [x] Update FilterMenu to work alongside header filters
- [x] Maintain filter state in URL params