import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { type BulletChartMetric } from "@/services/analyticsService";

interface BulletChartProps {
  metrics: BulletChartMetric[];
}

export function BulletChart({ metrics }: BulletChartProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-500";
      case "good":
        return "bg-blue-500";
      case "warning":
        return "bg-yellow-500";
      case "poor":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "good":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "poor":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "warning":
        return "Warning";
      case "poor":
        return "Poor";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="font-heading font-semibold text-lg">KPI Performance</h3>
      </div>

      <div className="space-y-6">
        {metrics.map((metric, idx) => {
          const maxValue = metric.poor;
          const actualPercent = (metric.actual / maxValue) * 100;
          const targetPercent = (metric.target / maxValue) * 100;
          const goodPercent = (metric.good / maxValue) * 100;
          const satisfactoryPercent = (metric.satisfactory / maxValue) * 100;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="font-medium text-sm">{metric.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {getStatusLabel(metric.status)}
                  </Badge>
                  <span className="text-sm font-semibold">
                    {metric.actual.toFixed(metric.unit === "ratio" ? 2 : 0)}
                    {metric.unit === "hours" ? "h" : metric.unit === "%" ? "%" : "x"}
                  </span>
                </div>
              </div>

              {/* Bullet Chart Visualization */}
              <div className="relative h-8 bg-muted rounded">
                {/* Background ranges */}
                <div className="absolute inset-0 flex">
                  <div
                    className="bg-red-200/50 dark:bg-red-900/20"
                    style={{ width: `${(metric.satisfactory / maxValue) * 100}%` }}
                  />
                  <div
                    className="bg-yellow-200/50 dark:bg-yellow-900/20"
                    style={{ width: `${((metric.good - metric.satisfactory) / maxValue) * 100}%` }}
                  />
                  <div
                    className="bg-green-200/50 dark:bg-green-900/20"
                    style={{ width: `${((maxValue - metric.good) / maxValue) * 100}%` }}
                  />
                </div>

                {/* Target marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground/40"
                  style={{ left: `${targetPercent}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground/60 rotate-45" />
                </div>

                {/* Actual value bar */}
                <div
                  className={`absolute top-2 bottom-2 ${getStatusColor(metric.status)} rounded-sm transition-all`}
                  style={{ width: `${Math.min(actualPercent, 100)}%` }}
                />
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0{metric.unit === "hours" ? "h" : metric.unit === "%" ? "%" : ""}</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-foreground/40" />
                  <span>Target: {metric.target.toFixed(metric.unit === "ratio" ? 1 : 0)}{metric.unit === "hours" ? "h" : metric.unit === "%" ? "%" : "x"}</span>
                </div>
                <span>{metric.poor}{metric.unit === "hours" ? "h" : metric.unit === "%" ? "%" : ""}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Bullet charts</strong> show actual performance vs target. The colored bar represents current value, the vertical line shows the target, and background shading indicates poor/satisfactory/good ranges.
        </p>
      </div>
    </Card>
  );
}