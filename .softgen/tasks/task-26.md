---
title: Create Reports Page with History
status: in_progress
priority: high
type: feature
tags: [reports, pdf, history]
created_by: agent
created_at: 2026-04-12
position: 26
---

## Notes
Create a dedicated Reports page accessible via Menu > Reports. The page should include report generation settings, history of generated reports with sizes, ability to redownload, and show ongoing generation status.

## Checklist
- [x] Create reports table in Supabase for storing report history
- [x] Create Reports page at /reports with generation form and history list
- [x] Move report settings from ReportSettings component to Reports page
- [x] Store generated reports in Supabase Storage
- [x] Display report history with name, date, size, download button
- [x] Show ongoing generation status with progress
- [x] Add Reports link to Menu dropdown
- [ ] Update index.tsx to use simple export button linking to reports page
