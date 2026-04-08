# GitHub Issue & Task Dashboard

## Vision
A developer-focused dashboard that connects to any GitHub repository, fetches all issues and tasks, and presents them through an intuitive interface with powerful filtering and reporting capabilities. Built for project managers, team leads, and developers who need a bird's-eye view of repository activity.

## Design
Color System (HSL format):
- `--primary: 220 90% 56%` (vibrant blue)
- `--background: 220 15% 10%` (deep slate)
- `--foreground: 210 40% 98%` (near white)
- `--card: 220 15% 14%` (elevated slate)
- `--accent: 270 70% 60%` (vibrant purple)
- `--muted: 220 15% 25%` (muted slate)
- `--border: 220 15% 20%` (subtle border)

Status colors:
- Open: `--status-open: 142 76% 45%` (green)
- In Progress: `--status-progress: 270 70% 60%` (purple)
- Closed: `--status-closed: 220 15% 45%` (gray)

Typography:
- Headings: Plus Jakarta Sans (600, 700)
- Body: Work Sans (400, 500, 600)

Style: Developer-focused minimalism with Linear-inspired precision — card-based layouts, subtle elevation, purposeful accent colors for status indicators, ample whitespace, clean data tables.

## Features
- GitHub repository connection (OAuth or personal access token)
- Fetch and display all issues and tasks from connected repositories
- Real-time status visualization (open, in progress, closed)
- Tag-based filtering system with multi-select
- Dashboard with issue cards and list views
- Analytics and reporting (issue count by status, assignment distribution, timeline view)
- Search functionality across titles and descriptions