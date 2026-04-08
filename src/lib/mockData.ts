import type { GitHubIssue } from "@/components/IssueTable";

export const mockIssues: GitHubIssue[] = [
  {
    id: "1",
    number: 134,
    title: "Add authentication with OAuth providers",
    status: "in_progress",
    repository: "acme/web-app",
    labels: ["enhancement", "auth", "high-priority"],
    assignee: "sarah.chen",
    url: "https://github.com/example/repo/issues/134",
    createdAt: "2026-03-15T10:30:00Z"
  },
  {
    id: "2",
    number: 133,
    title: "Fix responsive layout on mobile devices",
    status: "open",
    repository: "acme/web-app",
    labels: ["bug", "ui", "mobile"],
    assignee: "alex.rivera",
    url: "https://github.com/example/repo/issues/133",
    createdAt: "2026-03-14T14:20:00Z"
  },
  {
    id: "3",
    number: 128,
    title: "Implement real-time notifications",
    status: "open",
    repository: "acme/api-server",
    labels: ["feature", "websocket"],
    assignee: "john.doe",
    url: "https://github.com/example/repo/issues/128",
    createdAt: "2026-03-10T09:15:00Z"
  },
  {
    id: "4",
    number: 126,
    title: "Update dependencies to latest versions",
    status: "closed",
    repository: "acme/web-app",
    labels: ["maintenance", "dependencies"],
    assignee: "sarah.chen",
    url: "https://github.com/example/repo/issues/126",
    createdAt: "2026-03-08T11:00:00Z"
  },
  {
    id: "5",
    number: 125,
    title: "Add dark mode support",
    status: "in_progress",
    repository: "acme/web-app",
    labels: ["enhancement", "ui", "theme"],
    assignee: "alex.rivera",
    url: "https://github.com/example/repo/issues/125",
    createdAt: "2026-03-07T16:45:00Z"
  },
  {
    id: "6",
    number: 124,
    title: "Optimize database queries for better performance",
    status: "closed",
    repository: "acme/api-server",
    labels: ["performance", "database"],
    assignee: "john.doe",
    url: "https://github.com/example/repo/issues/124",
    createdAt: "2026-03-05T13:30:00Z"
  },
  {
    id: "7",
    number: 123,
    title: "Add unit tests for payment processing",
    status: "in_progress",
    repository: "acme/payment-service",
    labels: ["testing", "critical"],
    assignee: "emma.wilson",
    url: "https://github.com/example/repo/issues/123",
    createdAt: "2026-03-04T10:00:00Z"
  },
  {
    id: "8",
    number: 122,
    title: "Fix memory leak in background worker",
    status: "open",
    repository: "acme/api-server",
    labels: ["bug", "critical", "performance"],
    url: "https://github.com/example/repo/issues/122",
    createdAt: "2026-03-03T15:20:00Z"
  },
  {
    id: "9",
    number: 121,
    title: "Implement email verification flow",
    status: "closed",
    repository: "acme/auth-service",
    labels: ["feature", "auth", "email"],
    assignee: "sarah.chen",
    url: "https://github.com/example/repo/issues/121",
    createdAt: "2026-03-01T09:45:00Z"
  },
  {
    id: "10",
    number: 120,
    title: "Update API documentation",
    status: "open",
    repository: "acme/api-server",
    labels: ["documentation"],
    assignee: "alex.rivera",
    url: "https://github.com/example/repo/issues/120",
    createdAt: "2026-02-28T14:30:00Z"
  },
  {
    id: "11",
    number: 118,
    title: "Add rate limiting to public endpoints",
    status: "in_progress",
    repository: "acme/api-server",
    labels: ["security", "enhancement"],
    assignee: "john.doe",
    url: "https://github.com/example/repo/issues/118",
    createdAt: "2026-02-25T11:15:00Z"
  },
  {
    id: "12",
    number: 117,
    title: "Design new dashboard layout",
    status: "closed",
    repository: "acme/web-app",
    labels: ["design", "ui"],
    assignee: "emma.wilson",
    url: "https://github.com/example/repo/issues/117",
    createdAt: "2026-02-24T16:00:00Z"
  }
];

export function getUniqueRepositories(issues: GitHubIssue[]): string[] {
  return Array.from(new Set(issues.map(issue => issue.repository))).sort();
}

export function getUniqueLabels(issues: GitHubIssue[]): string[] {
  const allLabels = issues.flatMap(issue => issue.labels);
  return Array.from(new Set(allLabels)).sort();
}

export function calculateMetrics(issues: GitHubIssue[]) {
  const statusCounts = {
    open: issues.filter(i => i.status === "open").length,
    inProgress: issues.filter(i => i.status === "in_progress").length,
    closed: issues.filter(i => i.status === "closed").length
  };

  const total = issues.length;
  const completed = statusCounts.closed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const segments = [
    {
      percentage: Math.round((statusCounts.open / total) * 100),
      color: "bg-status-open",
      label: "Open"
    },
    {
      percentage: Math.round((statusCounts.inProgress / total) * 100),
      color: "bg-status-progress",
      label: "In Progress"
    },
    {
      percentage: Math.round((statusCounts.closed / total) * 100),
      color: "bg-status-closed",
      label: "Closed"
    }
  ];

  return {
    statusCounts,
    completionRate,
    segments
  };
}