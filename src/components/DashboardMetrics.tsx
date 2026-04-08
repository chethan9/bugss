import { Card } from "@/components/ui/card";

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
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Summary</h2>
      <Card className="p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center space-y-2">
              <div className={`text-5xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}