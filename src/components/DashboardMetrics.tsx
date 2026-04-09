import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderGit2, CircleDot, CircleCheck, Circle } from "lucide-react";
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Repositories */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FolderGit2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Repositories</p>
            <p className="text-2xl font-heading font-bold">{totalRepos}</p>
          </div>
        </div>
      </Card>

      {/* Total Issues */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Circle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Total Issues</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-heading font-bold">{totalIssues}</p>
              {createdSparkline && (
                <div className="flex-1">
                  <Sparkline data={createdSparkline} color="blue" height={20} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Open Issues */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <CircleDot className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Open</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-heading font-bold text-green-500">{openIssues}</p>
              {openSparkline && (
                <div className="flex-1">
                  <Sparkline data={openSparkline} color="green" height={20} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* In Progress Issues */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
              In Progress
            </Badge>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-heading font-bold text-purple-500">{inProgressIssues}</p>
          </div>
        </div>
      </Card>

      {/* Closed Issues */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-500/10 rounded-lg">
            <CircleCheck className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Closed</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-heading font-bold text-gray-500">{closedIssues}</p>
              {closedSparkline && (
                <div className="flex-1">
                  <Sparkline data={closedSparkline} color="gray" height={20} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}