---
title: PDF Export & Widget Visibility Settings
status: in_progress
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
- [ ] Install jspdf and html2canvas for PDF generation
- [ ] Create PDF export button in header
- [ ] Implement multi-section PDF capture (Summary, Analytics, Issues)
- [ ] Add page breaks between sections
- [ ] Format PDF with proper headers and styling
- [ ] Create Settings dropdown component
- [ ] Add widget visibility toggles (checkboxes)
- [ ] Save visibility preferences to localStorage
- [ ] Load preferences on mount
- [ ] Show/hide widgets based on settings
- [ ] Add "Reset to defaults" option
- [ ] Add export timestamp to PDF