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
    { label: "In Progress", value: inProgressIssues, color: "text-yellow-600" },
    { label: "Closed", value: closedIssues, color: "text-gray-500" },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <div 
            key={metric.label} 
            className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-smooth active-scale cursor-default"
          >
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                {metric.label}
              </span>
              <div className={`text-3xl font-semibold ${metric.color}`}>
                {metric.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}