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
    { label: "Open", value: openIssues, color: "text-[#57d9a3]" },
    { label: "In Progress", value: inProgressIssues, color: "text-[#a78bfa]" },
    { label: "Closed", value: closedIssues, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-heading">Summary</h2>
      <div className="flex flex-wrap items-center gap-12 lg:gap-16 pt-2 pb-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex flex-col items-center justify-center gap-1">
            <span className={`text-5xl font-light tracking-tight ${metric.color}`}>
              {metric.value}
            </span>
            <span className="text-sm text-muted-foreground font-medium">
              {metric.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}