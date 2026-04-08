import { Badge } from "@/components/ui/badge";

interface MetricCardProps {
  value: number;
  label: string;
  color?: "green" | "red" | "blue" | "yellow" | "gray";
}

function MetricCard({ value, label, color }: MetricCardProps) {
  const colorClasses = {
    green: "text-status-open",
    red: "text-red-500",
    blue: "text-status-progress",
    yellow: "text-yellow-500",
    gray: "text-muted-foreground"
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className={`text-5xl font-bold ${color ? colorClasses[color] : "text-foreground"}`}>
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

interface DashboardMetricsProps {
  totalRepos: number;
  totalIssues: number;
  open: number;
  inProgress: number;
  closed: number;
}

export function DashboardMetrics({ totalRepos, totalIssues, open, inProgress, closed }: DashboardMetricsProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6">Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <MetricCard value={totalRepos} label="Repositories" />
        <MetricCard value={totalIssues} label="Total Issues" />
        <MetricCard value={open} label="Open" color="green" />
        <MetricCard value={inProgress} label="In Progress" color="blue" />
        <MetricCard value={closed} label="Closed" color="gray" />
      </div>
    </div>
  );
}