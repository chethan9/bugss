import { Card } from "@/components/ui/card";
import { Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { EfficiencyStats } from "@/services/analyticsService";

interface BugFixEfficiencyProps {
  stats: EfficiencyStats;
}

export function BugFixEfficiency({ stats }: BugFixEfficiencyProps) {
  const getStatusConfig = () => {
    switch (stats.status) {
      case "excellent":
        return {
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
          badge: "bg-green-100 text-green-700 border-green-300",
          message: "Excellent",
          progressColor: "bg-green-500",
        };
      case "good":
        return {
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          badge: "bg-blue-100 text-blue-700 border-blue-300",
          message: "Good",
          progressColor: "bg-blue-500",
        };
      default:
        return {
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          badge: "bg-red-100 text-red-700 border-red-300",
          message: "Needs Improvement",
          progressColor: "bg-red-500",
        };
    }
  };

  const config = getStatusConfig();
  const percentage = Math.min(stats.ratio * 100, 150); // Cap at 150% for display

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className={`h-5 w-5 ${config.color}`} />
            <h3 className="font-semibold text-base">Bug Fix Efficiency</h3>
          </div>
          <Badge className={config.badge}>
            {config.message}
          </Badge>
        </div>

        <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
          <div className="text-center mb-3">
            <div className={`text-4xl font-bold ${config.color} mb-1`}>
              {stats.ratio.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Closed / Created Ratio (Last 30 days)
            </p>
          </div>
          <div className="space-y-2">
            <Progress 
              value={percentage} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.0 (Poor)</span>
              <span>1.0 (Good)</span>
              <span>1.5+ (Excellent)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1 text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Closed</p>
            <p className="text-2xl font-semibold text-green-600">{stats.closedCount}</p>
          </div>
          <div className="space-y-1 text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.createdCount}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {stats.status === "excellent" 
              ? "🎯 Team is highly efficient, closing issues faster than creation."
              : stats.status === "good"
              ? "✓ Team efficiency is solid. Maintaining good bug closure rate."
              : "⚠️ Team is struggling to keep up. Consider resource allocation."}
          </p>
        </div>
      </div>
    </Card>
  );
}