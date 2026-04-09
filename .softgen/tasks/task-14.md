---
title: PDF Export & Widget Visibility Settings
status: done
priority: high
type: feature
tags: [export, settings, pdf, customization]
created_by: agent
created_at: 2026-04-09
position: 14
---

## Notes
Add PDF export functionality to generate professional reports from the dashboard and widget visibility settings to customize which analytics sections are displayed.

## Checklist
- [x] Install jspdf and html2canvas for PDF generation
- [x] Create PDF export button in header
- [x] Implement multi-section PDF capture (Summary, Analytics, Issues)
- [x] Add page breaks between sections
- [x] Format PDF with proper headers and styling
- [x] Create Settings dropdown component
- [x] Add widget visibility toggles (checkboxes)
- [x] Save visibility preferences to localStorage
- [x] Load preferences on mount
- [x] Show/hide widgets based on settings
- [x] Add "Reset to defaults" option
- [x] Add export timestamp to PDF