import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Clock } from "lucide-react";

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
  isLoading?: boolean;
}

export function ProjectHealthGauge({ issues, slaTargetDays = 7, isLoading }: ProjectHealthGaugeProps) {
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
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const oldIssuesCount = openIssues.filter(i => new Date(i.createdAt) < thirtyDaysAgo).length;
  
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
  
  const reopenedCount = issues.filter(i => 
    i.labels.some(l => l.toLowerCase().includes("reopen"))
  ).length;
  const reopenRate = totalIssues > 0 ? (reopenedCount / totalIssues) * 100 : 0;

  const criticalOpenPct = totalIssues > 0 ? (criticalOpen / totalIssues) * 100 : 0;
  const highOpenPct = totalIssues > 0 ? (highOpen / totalIssues) * 100 : 0;
  const oldIssuesPct = totalIssues > 0 ? (oldIssuesCount / totalIssues) * 100 : 0;
  const resolutionDelayPct = Math.min((avgResolutionDays / slaTargetDays) * 100, 100);

  const healthScore = Math.max(0, Math.min(100, Math.round(
    100 -
    (criticalOpenPct * 0.4) -
    (highOpenPct * 0.2) -
    (reopenRate * 0.15) -
    (oldIssuesPct * 0.15) -
    (resolutionDelayPct * 0.1)
  )));

  const getStatus = () => {
    if (healthScore >= 70) return { 
      label: "Healthy", 
      color: "text-emerald-600 dark:text-emerald-400", 
      badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      icon: CheckCircle2
    };
    if (healthScore >= 40) return { 
      label: "At Risk", 
      color: "text-amber-600 dark:text-amber-400", 
      badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      icon: AlertTriangle
    };
    return { 
      label: "Critical", 
      color: "text-rose-600 dark:text-rose-400", 
      badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
      icon: XCircle
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Needle rotation: 0% = -90deg (pointing left), 100% = 90deg (pointing right)
  const needleRotation = -90 + (healthScore / 100) * 180;

  if (isLoading) {
    return (
      <Card className="p-6 border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex flex-col items-center mb-6">
          <Skeleton className="h-32 w-52 rounded-lg" />
          <Skeleton className="h-12 w-28 mt-4" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex justify-between items-center py-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (totalIssues === 0) {
    return (
      <Card className="p-6 border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Project Health</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Activity className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No issues to analyze</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${status.badgeClass}`}>
            <Activity className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-lg">Project Health</h3>
        </div>
        <Badge className={`${status.badgeClass} border-0 px-3 py-1`}>
          <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
          {status.label}
        </Badge>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center mb-6">
        <svg width="200" height="110" viewBox="0 0 200 110" className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            className="text-muted/20"
          />
          
          {/* Colored arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = -180 + (tick / 100) * 180;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + 68 * Math.cos(rad);
            const y1 = 100 + 68 * Math.sin(rad);
            const x2 = 100 + 75 * Math.cos(rad);
            const y2 = 100 + 75 * Math.sin(rad);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground/30"
                strokeLinecap="round"
              />
            );
          })}
          
          {/* Needle */}
          <g style={{ transform: `rotate(${needleRotation}deg)`, transformOrigin: "100px 100px" }}>
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
          </g>
          
          {/* Center circle */}
          <circle cx="100" cy="100" r="8" className="fill-foreground" />
          <circle cx="100" cy="100" r="4" className="fill-background" />
        </svg>
        
        {/* Score - positioned BELOW the gauge */}
        <div className="mt-2 text-center">
          <span className={`text-4xl font-bold ${status.color}`}>
            {healthScore}
          </span>
          <span className={`text-xl font-semibold ${status.color}`}>%</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-1">
        <MetricRow 
          label="Critical Issues" 
          value={criticalOpen}
          percentage={criticalOpenPct}
          status={criticalOpenPct > 5 ? "danger" : "normal"}
          icon={<XCircle className="h-4 w-4" />}
        />
        <MetricRow 
          label="High Priority" 
          value={highOpen}
          percentage={highOpenPct}
          status={highOpenPct > 15 ? "warning" : "normal"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <MetricRow 
          label="Reopen Rate" 
          value={null}
          percentage={reopenRate}
          status={reopenRate > 10 ? "warning" : "normal"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricRow 
          label="Aging Issues (30d+)" 
          value={oldIssuesCount}
          percentage={oldIssuesPct}
          status={oldIssuesPct > 20 ? "warning" : "normal"}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricRow 
          label="Avg Resolution" 
          value={null}
          customValue={`${avgResolutionDays.toFixed(1)}d / ${slaTargetDays}d SLA`}
          status={avgResolutionDays > slaTargetDays ? "danger" : "success"}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2.5 text-sm">
          <div className={`p-1.5 rounded-lg ${status.badgeClass}`}>
            <StatusIcon className="h-4 w-4" />
          </div>
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

function MetricRow({ 
  label, 
  value, 
  percentage,
  customValue,
  status, 
  icon 
}: { 
  label: string; 
  value: number | null;
  percentage?: number;
  customValue?: string;
  status: "normal" | "warning" | "danger" | "success";
  icon: React.ReactNode;
}) {
  const statusColors = {
    normal: "text-muted-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-rose-600 dark:text-rose-400",
    success: "text-emerald-600 dark:text-emerald-400"
  };

  const iconBg = {
    normal: "bg-muted/50 text-muted-foreground",
    warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    danger: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
    success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-md ${iconBg[status]}`}>
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className={`text-sm font-semibold ${statusColors[status]}`}>
        {customValue ? (
          customValue
        ) : (
          <>
            {value !== null && <span>{value}</span>}
            {percentage !== undefined && (
              <span className={value !== null ? "ml-1" : ""}>
                {percentage.toFixed(1)}%
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}