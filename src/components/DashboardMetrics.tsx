import { Card } from "@/components/ui/card";
import { FolderGit2, CircleDot, CircleCheck, Circle, Clock, HelpCircle } from "lucide-react";
import { Sparkline } from "@/components/analytics/Sparkline";
import { type SparklineData } from "@/services/analyticsService";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardMetricsProps {
  totalRepos: number;
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  closedIssues: number;
  openSparkline?: SparklineData;
  closedSparkline?: SparklineData;
  createdSparkline?: SparklineData;
}

export function DashboardMetrics({
  totalRepos,
  totalIssues,
  openIssues,
  inProgressIssues,
  closedIssues,
  openSparkline,
  closedSparkline,
  createdSparkline,
}: DashboardMetricsProps) {
  const openPercent = totalIssues > 0 ? ((openIssues / totalIssues) * 100).toFixed(1) : null;
  const closedPercent = totalIssues > 0 ? ((closedIssues / totalIssues) * 100).toFixed(1) : null;
  const inProgressPercent = totalIssues > 0 ? ((inProgressIssues / totalIssues) * 100).toFixed(1) : null;

  const cards = [
    {
      id: "repos",
      show: true,
      icon: <FolderGit2 className="h-4 w-4 text-primary" />,
      iconBg: "bg-primary/10",
      label: "Repositories",
      tooltip: "Number of GitHub repositories currently connected and being analyzed.",
      value: totalRepos,
      valueColor: "text-foreground",
      sparkline: null,
      percent: null,
    },
    {
      id: "total",
      show: totalIssues > 0,
      icon: <Circle className="h-4 w-4 text-blue-500" />,
      iconBg: "bg-blue-500/10",
      label: "Total Issues",
      tooltip: "Total count of all issues (open + closed) across selected repositories. Sparkline shows issue creation trend.",
      value: totalIssues,
      valueColor: "text-foreground",
      sparkline: createdSparkline,
      sparklineColor: "blue" as const,
      percent: null,
    },
    {
      id: "open",
      show: openIssues > 0,
      icon: <CircleDot className="h-4 w-4 text-green-500" />,
      iconBg: "bg-green-500/10",
      label: "Open",
      tooltip: "Issues currently open and requiring attention. Percentage shows ratio to total. Sparkline shows trend over time.",
      value: openIssues,
      valueColor: "text-green-500",
      sparkline: openSparkline,
      sparklineColor: "green" as const,
      percent: openPercent,
    },
    {
      id: "progress",
      show: inProgressIssues > 0,
      icon: <Clock className="h-4 w-4 text-purple-500" />,
      iconBg: "bg-purple-500/10",
      label: "In Progress",
      tooltip: "Issues actively being worked on (have assignees or 'in progress' labels).",
      value: inProgressIssues,
      valueColor: "text-purple-500",
      sparkline: null,
      percent: inProgressPercent,
    },
    {
      id: "closed",
      show: closedIssues > 0,
      icon: <CircleCheck className="h-4 w-4 text-gray-500" />,
      iconBg: "bg-gray-500/10",
      label: "Closed",
      tooltip: "Resolved issues. Higher percentage = healthier backlog. Sparkline shows closure trend.",
      value: closedIssues,
      valueColor: "text-gray-500",
      sparkline: closedSparkline,
      sparklineColor: "gray" as const,
      percent: closedPercent,
    },
  ];

  const visibleCards = cards.filter((card) => card.show);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {visibleCards.map((card) => (
          <Card key={card.id} className="p-3">
            <div className="flex items-start gap-2">
              <div className={`p-1.5 rounded-md ${card.iconBg} flex-shrink-0`}>
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-xs">
                      {card.tooltip}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className={`text-xl font-heading font-bold ${card.valueColor}`}>
                    {card.value.toLocaleString()}
                  </p>
                  {card.percent && (
                    <span className="text-xs text-muted-foreground">
                      ({card.percent}%)
                    </span>
                  )}
                </div>
                {card.sparkline && card.sparkline.values.length > 0 && (
                  <div className="mt-1">
                    <Sparkline 
                      data={card.sparkline} 
                      color={card.sparklineColor || "blue"} 
                      height={20} 
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}