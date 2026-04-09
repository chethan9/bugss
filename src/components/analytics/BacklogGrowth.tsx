import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BacklogGrowthStats } from "@/services/analyticsService";

interface BacklogGrowthProps {
  stats: BacklogGrowthStats;
}

export function BacklogGrowth({ stats }: BacklogGrowthProps) {
  const getTrendConfig = () => {
    switch (stats.trend) {
      case "growing":
        return {
          icon: TrendingUp,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          badge: "bg-red-100 text-red-700 border-red-300",
          message: "Backlog Growing",
        };
      case "shrinking":
        return {
          icon: TrendingDown,
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
          badge: "bg-green-100 text-green-700 border-green-300",
          message: "Backlog Shrinking",
        };
      default:
        return {
          icon: Minus,
          color: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200",
          badge: "bg-gray-100 text-gray-700 border-gray-300",
          message: "Backlog Stable",
        };
    }
  };

  const config = getTrendConfig();
  const Icon = config.icon;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <h3 className="font-semibold text-base">Backlog Growth Rate</h3>
          </div>
          <Badge className={config.badge}>
            {config.message}
          </Badge>
        </div>

        <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
          <div className="text-center">
            <div className={`text-4xl font-bold ${config.color} mb-2`}>
              {stats.growthRate > 0 ? '+' : ''}{Math.round(stats.growthRate)}%
            </div>
            <p className="text-sm text-muted-foreground">
              Last 7 days (Created vs Closed)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-semibold text-blue-600">{stats.created7d}</div>
            <div className="text-xs text-muted-foreground mt-1">Created</div>
          </div>
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-semibold text-green-600">{stats.closed7d}</div>
            <div className="text-xs text-muted-foreground mt-1">Closed</div>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {stats.trend === "growing" 
              ? "⚠️ Team is falling behind. More issues created than resolved."
              : stats.trend === "shrinking"
              ? "✓ Healthy progress. Team closing issues faster than creation rate."
              : "→ Balanced workload. Creation and resolution rates are similar."}
          </p>
        </div>
      </div>
    </Card>
  );
}