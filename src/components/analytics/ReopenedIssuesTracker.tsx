import { Card } from "@/components/ui/card";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import type { ReopenedIssuesStats } from "@/services/analyticsService";

interface ReopenedIssuesTrackerProps {
  stats: ReopenedIssuesStats;
}

export function ReopenedIssuesTracker({ stats }: ReopenedIssuesTrackerProps) {
  const getStatusColor = () => {
    if (stats.reopenedPercentage === 0) return "text-green-600";
    if (stats.reopenedPercentage < 5) return "text-green-600";
    if (stats.reopenedPercentage < 10) return "text-amber-600";
    return "text-red-600";
  };

  const getStatusText = () => {
    if (stats.reopenedPercentage === 0) return "Excellent";
    if (stats.reopenedPercentage < 5) return "Good";
    if (stats.reopenedPercentage < 10) return "Fair";
    return "Needs Attention";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">🔁 Reopened Issues Tracker</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className={`text-4xl font-heading font-bold ${getStatusColor()}`}>
            {stats.reopenedPercentage.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.reopenedCount} of {stats.total} closed issues reopened
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Quality Status:</span>
          <span className={`text-sm font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 <span className="font-medium">Insight:</span> High reopen rate ({">"} 10%) suggests 
            poor fix quality or insufficient testing.
          </p>
        </div>
      </div>
    </Card>
  );
}