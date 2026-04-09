import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderGit2, CircleDot, CircleCheck, Circle, Clock } from "lucide-react";
import { Sparkline } from "@/components/analytics/Sparkline";
import { type SparklineData } from "@/services/analyticsService";

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
  // Calculate percentages
  const openPercent = totalIssues > 0 ? ((openIssues / totalIssues) * 100).toFixed(1) : null;
  const closedPercent = totalIssues > 0 ? ((closedIssues / totalIssues) * 100).toFixed(1) : null;
  const inProgressPercent = totalIssues > 0 ? ((inProgressIssues / totalIssues) * 100).toFixed(1) : null;

  // Build visible cards array - only include cards with data
  const cards = [
    // Repositories - always show
    {
      id: "repos",
      show: true,
      icon: <FolderGit2 className="h-5 w-5 text-primary" />,
      iconBg: "bg-primary/10",
      label: "Repositories",
      value: totalRepos,
      valueColor: "text-foreground",
      sparkline: null,
      percent: null,
    },
    // Total Issues - always show if > 0
    {
      id: "total",
      show: totalIssues > 0,
      icon: <Circle className="h-5 w-5 text-blue-500" />,
      iconBg: "bg-blue-500/10",
      label: "Total Issues",
      value: totalIssues,
      valueColor: "text-foreground",
      sparkline: createdSparkline,
      sparklineColor: "blue" as const,
      percent: null,
    },
    // Open Issues - show if > 0
    {
      id: "open",
      show: openIssues > 0,
      icon: <CircleDot className="h-5 w-5 text-green-500" />,
      iconBg: "bg-green-500/10",
      label: "Open",
      value: openIssues,
      valueColor: "text-green-500",
      sparkline: openSparkline,
      sparklineColor: "green" as const,
      percent: openPercent,
    },
    // In Progress - show if > 0
    {
      id: "progress",
      show: inProgressIssues > 0,
      icon: <Clock className="h-5 w-5 text-purple-500" />,
      iconBg: "bg-purple-500/10",
      label: "In Progress",
      value: inProgressIssues,
      valueColor: "text-purple-500",
      sparkline: null,
      percent: inProgressPercent,
    },
    // Closed Issues - show if > 0
    {
      id: "closed",
      show: closedIssues > 0,
      icon: <CircleCheck className="h-5 w-5 text-gray-500" />,
      iconBg: "bg-gray-500/10",
      label: "Closed",
      value: closedIssues,
      valueColor: "text-gray-500",
      sparkline: closedSparkline,
      sparklineColor: "gray" as const,
      percent: closedPercent,
    },
  ];

  const visibleCards = cards.filter((card) => card.show);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(visibleCards.length, 5)} gap-4`}>
      {visibleCards.map((card) => (
        <Card key={card.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${card.iconBg} flex-shrink-0`}>
              {card.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className={`text-2xl font-heading font-bold ${card.valueColor}`}>
                  {card.value.toLocaleString()}
                </p>
                {card.percent && (
                  <span className="text-xs text-muted-foreground">
                    ({card.percent}%)
                  </span>
                )}
              </div>
              {card.sparkline && card.sparkline.values.length > 0 && (
                <div className="mt-2">
                  <Sparkline 
                    data={card.sparkline} 
                    color={card.sparklineColor || "blue"} 
                    height={24} 
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}