import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  status: string;
  severity?: string;
  createdAt: string;
  closedAt?: string | null;
  labels: string[];
  repository: string;
}

interface ProjectHealthGaugeProps {
  issues: GitHubIssue[];
  slaTargetDays?: number;
}

export function ProjectHealthGauge({ issues, slaTargetDays = 7 }: ProjectHealthGaugeProps) {
  // Calculate metrics from issues
  const totalIssues = issues.length;
  const openIssues = issues.filter(i => i.status === "open");
  const closedIssues = issues.filter(i => i.status === "closed");
  
  const criticalOpen = openIssues.filter(i => 
    i.severity?.toLowerCase() === "critical" || 
    i.labels.some(l => l.toLowerCase().includes("critical"))
  ).length;
  
  const highOpen = openIssues.filter(i => 
    i.severity?.toLowerCase() === "high" || 
    i.labels.some(l => l.toLowerCase().includes("high"))
  ).length;
  
  // Calculate old issues (> 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const oldIssuesCount = openIssues.filter(i => new Date(i.createdAt) < thirtyDaysAgo).length;
  
  // Calculate average resolution time
  const resolvedIssues = closedIssues.filter(i => i.closedAt);
  let avgResolutionDays = 0;
  if (resolvedIssues.length > 0) {
    const totalDays = resolvedIssues.reduce((sum, issue) => {
      const created = new Date(issue.createdAt);
      const closed = new Date(issue.closedAt!);
      return sum + (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    avgResolutionDays = totalDays / resolvedIssues.length;
  }
  
  // Calculate reopen rate (estimate based on labels)
  const reopenedCount = issues.filter(i => 
    i.labels.some(l => l.toLowerCase().includes("reopen"))
  ).length;
  const reopenRate = totalIssues > 0 ? (reopenedCount / totalIssues) * 100 : 0;

  // Calculate percentages
  const criticalOpenPct = totalIssues > 0 ? (criticalOpen / totalIssues) * 100 : 0;
  const highOpenPct = totalIssues > 0 ? (highOpen / totalIssues) * 100 : 0;
  const oldIssuesPct = totalIssues > 0 ? (oldIssuesCount / totalIssues) * 100 : 0;
  const resolutionDelayPct = Math.min((avgResolutionDays / slaTargetDays) * 100, 100);

  // Calculate health score
  const healthScore = Math.max(0, Math.min(100, Math.round(
    100 -
    (criticalOpenPct * 0.4) -
    (highOpenPct * 0.2) -
    (reopenRate * 0.15) -
    (oldIssuesPct * 0.15) -
    (resolutionDelayPct * 0.1)
  )));

  // Determine status
  const getStatus = () => {
    if (healthScore >= 70) return { label: "Healthy", color: "text-green-500", bg: "bg-green-500", icon: CheckCircle2 };
    if (healthScore >= 40) return { label: "At Risk", color: "text-yellow-500", bg: "bg-yellow-500", icon: AlertTriangle };
    return { label: "Poor", color: "text-red-500", bg: "bg-red-500", icon: XCircle };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Gauge angle calculation (180 degree arc)
  const angle = (healthScore / 100) * 180;

  if (totalIssues === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Project Health</h3>
        </div>
        <p className="text-muted-foreground text-sm">No issues to analyze</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Project Health</h3>
        <Badge variant={healthScore >= 70 ? "default" : healthScore >= 40 ? "secondary" : "destructive"} className="ml-auto">
          {status.label}
        </Badge>
      </div>

      {/* Gauge */}
      <div className="relative flex justify-center mb-4">
        <svg width="200" height="120" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/30"
            strokeLinecap="round"
          />
          {/* Colored segments */}
          <path
            d="M 20 100 A 80 80 0 0 1 60 35"
            fill="none"
            stroke="#ef4444"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M 60 35 A 80 80 0 0 1 140 35"
            fill="none"
            stroke="#eab308"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M 140 35 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#22c55e"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* Needle */}
          <g transform={`rotate(${angle - 90}, 100, 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="currentColor"
              strokeWidth="3"
              className="text-foreground"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="8" fill="currentColor" className="text-foreground" />
          </g>
        </svg>
        
        {/* Score display */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <div className={`text-4xl font-bold ${status.color}`}>
            {healthScore}%
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Critical Issues</span>
          <span className={criticalOpenPct > 5 ? "text-red-500 font-medium" : ""}>
            {criticalOpen} ({criticalOpenPct.toFixed(1)}%)
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">High Priority</span>
          <span className={highOpenPct > 15 ? "text-orange-500 font-medium" : ""}>
            {highOpen} ({highOpenPct.toFixed(1)}%)
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Reopen Rate</span>
          <span className={reopenRate > 10 ? "text-yellow-500 font-medium" : ""}>
            {reopenRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Aging Issues (30d+)</span>
          <span className={oldIssuesPct > 20 ? "text-yellow-500 font-medium" : ""}>
            {oldIssuesCount} ({oldIssuesPct.toFixed(1)}%)
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Avg Resolution</span>
          <span className={avgResolutionDays > slaTargetDays ? "text-red-500 font-medium" : "text-green-500"}>
            {avgResolutionDays.toFixed(1)}d / {slaTargetDays}d SLA
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          <StatusIcon className={`h-4 w-4 ${status.color}`} />
          <span className="text-muted-foreground">
            {healthScore >= 70 
              ? "Project is in good shape. Keep monitoring."
              : healthScore >= 40
              ? "Some areas need attention. Review priorities."
              : "Immediate action required. Focus on critical issues."}
          </span>
        </div>
      </div>
    </Card>
  );
}