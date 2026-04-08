interface DashboardMetricsProps {
  totalRepos: number;
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  closedIssues: number;
}

export function DashboardMetrics({
  totalRepos,
  totalIssues,
  openIssues,
  inProgressIssues,
  closedIssues,
}: DashboardMetricsProps) {
  const metrics = [
    { label: "Repositories", value: totalRepos, color: "text-foreground" },
    { label: "Total Issues", value: totalIssues, color: "text-foreground" },
    { label: "Open", value: openIssues, color: "text-green-600" },
    { label: "In Progress", value: inProgressIssues, color: "text-purple-600" },
    { label: "Closed", value: closedIssues, color: "text-gray-600" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-heading font-semibold">Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center space-y-1">
            <div className={`text-4xl font-heading font-bold ${metric.color}`}>
              {metric.value}
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {metric.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}