import { Card } from "@/components/ui/card";
import { FolderGit2, CircleDot, CircleCheck, Circle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardMetricsProps {
  totalRepos: number;
  totalIssues: number;
  openIssues: number;
  closedIssues: number;
}

export function DashboardMetrics({
  totalRepos,
  totalIssues,
  openIssues,
  closedIssues,
}: DashboardMetricsProps) {
  const openPercentage = totalIssues > 0 ? ((openIssues / totalIssues) * 100).toFixed(1) : "0.0";
  const closedPercentage = totalIssues > 0 ? ((closedIssues / totalIssues) * 100).toFixed(1) : "0.0";

  const metrics = [
    {
      label: "Repositories",
      value: totalRepos,
      percentage: null,
      icon: FolderGit2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      tooltip: "Connected repositories",
    },
    {
      label: "Total Issues",
      value: totalIssues,
      percentage: null,
      icon: Circle,
      color: "text-primary",
      bgColor: "bg-primary/10",
      tooltip: "Total issues across all repositories",
    },
    {
      label: "Open",
      value: openIssues,
      percentage: openPercentage,
      icon: CircleDot,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      tooltip: "Open issues requiring attention",
    },
    {
      label: "Closed",
      value: closedIssues,
      percentage: closedPercentage,
      icon: CircleCheck,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      tooltip: "Resolved issues",
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="p-3 hover:border-primary/50 transition-colors"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col gap-2">
                  {/* Top: Icon + Label */}
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${metric.bgColor}`}>
                      <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {metric.label}
                    </span>
                  </div>
                  
                  {/* Middle: Main Value */}
                  <div className="text-2xl font-bold tracking-tight">
                    {metric.value.toLocaleString()}
                  </div>
                  
                  {/* Bottom: Percentage (if applicable) */}
                  {metric.percentage !== null && (
                    <div className={`text-xs font-medium ${metric.color}`}>
                      {metric.percentage}%
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{metric.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}