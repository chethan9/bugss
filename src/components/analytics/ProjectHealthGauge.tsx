import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";

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
    if (healthScore >= 70) return { 
      label: "Healthy", 
      color: "text-emerald-600 dark:text-emerald-400", 
      bgColor: "bg-emerald-500",
      badgeBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-500"
    };
    if (healthScore >= 40) return { 
      label: "At Risk", 
      color: "text-amber-600 dark:text-amber-400", 
      bgColor: "bg-amber-500",
      badgeBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      icon: AlertTriangle,
      gradient: "from-amber-500 to-orange-500"
    };
    return { 
      label: "Critical", 
      color: "text-rose-600 dark:text-rose-400", 
      bgColor: "bg-rose-500",
      badgeBg: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      icon: XCircle,
      gradient: "from-rose-500 to-red-500"
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Gauge angle calculation (180 degree arc)
  const angle = (healthScore / 100) * 180;

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
        <div className="flex justify-center mb-6">
          <Skeleton className="h-32 w-48 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
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
    <Card className="p-6 border-border/50 overflow-hidden relative">
      {/* Subtle gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${status.gradient} opacity-[0.03]`} />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${status.gradient} shadow-lg`}>
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-lg">Project Health</h3>
          </div>
          <Badge variant="outline" className={`${status.badgeBg} border font-medium px-3 py-1`}>
            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
            {status.label}
          </Badge>
        </div>

        {/* Gauge */}
        <div className="relative flex justify-center mb-6">
          <svg width="220" height="130" viewBox="0 0 220 130">
            {/* Background arc with gradient */}
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            {/* Background arc */}
            <path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke="url(#bgGradient)"
              strokeWidth="16"
              strokeLinecap="round"
              className="text-muted"
            />
            
            {/* Colored progress arc */}
            <path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${(healthScore / 100) * 283} 283`}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((tick, i) => {
              const tickAngle = (tick / 100) * 180 - 180;
              const rad = (tickAngle * Math.PI) / 180;
              const x1 = 110 + 75 * Math.cos(rad);
              const y1 = 110 + 75 * Math.sin(rad);
              const x2 = 110 + 85 * Math.cos(rad);
              const y2 = 110 + 85 * Math.sin(rad);
              return (
                <line
                  key={i}
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
            <g transform={`rotate(${angle - 180}, 110, 110)`}>
              <line
                x1="110"
                y1="110"
                x2="110"
                y2="35"
                stroke="currentColor"
                strokeWidth="3"
                className="text-foreground"
                strokeLinecap="round"
              />
              <circle cx="110" cy="110" r="10" className={`fill-current ${status.color}`} />
              <circle cx="110" cy="110" r="5" fill="white" className="dark:fill-gray-900" />
            </g>
          </svg>
          
          {/* Score display */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
            <div className={`text-5xl font-bold ${status.color} tracking-tight`}>
              {healthScore}
              <span className="text-2xl">%</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-3">
          <MetricRow 
            label="Critical Issues" 
            value={`${criticalOpen}`}
            subValue={`${criticalOpenPct.toFixed(1)}%`}
            status={criticalOpenPct > 5 ? "danger" : "normal"}
            icon={<XCircle className="h-4 w-4" />}
          />
          <MetricRow 
            label="High Priority" 
            value={`${highOpen}`}
            subValue={`${highOpenPct.toFixed(1)}%`}
            status={highOpenPct > 15 ? "warning" : "normal"}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <MetricRow 
            label="Reopen Rate" 
            value={`${reopenRate.toFixed(1)}%`}
            status={reopenRate > 10 ? "warning" : "normal"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricRow 
            label="Aging Issues (30d+)" 
            value={`${oldIssuesCount}`}
            subValue={`${oldIssuesPct.toFixed(1)}%`}
            status={oldIssuesPct > 20 ? "warning" : "normal"}
            icon={<TrendingDown className="h-4 w-4" />}
          />
          <MetricRow 
            label="Avg Resolution" 
            value={`${avgResolutionDays.toFixed(1)}d`}
            subValue={`/ ${slaTargetDays}d SLA`}
            status={avgResolutionDays > slaTargetDays ? "danger" : "success"}
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        {/* Footer message */}
        <div className="mt-5 pt-4 border-t border-border/50">
          <div className={`flex items-center gap-2.5 text-sm ${status.color}`}>
            <div className={`p-1.5 rounded-lg ${status.badgeBg}`}>
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
      </div>
    </Card>
  );
}

// Helper component for metric rows
function MetricRow({ 
  label, 
  value, 
  subValue, 
  status, 
  icon 
}: { 
  label: string; 
  value: string; 
  subValue?: string; 
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
        {value}
        {subValue && <span className="text-muted-foreground font-normal ml-1">{subValue}</span>}
      </div>
    </div>
  );
}