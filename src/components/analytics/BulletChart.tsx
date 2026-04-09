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

  const formatValue = (value: number, unit: string) => {
    const formatted = unit === "ratio" ? value.toFixed(2) : Math.round(value);
    const suffix = unit === "hours" ? "h" : unit === "%" ? "%" : "x";
    return `${formatted}${suffix}`;
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
          const actualPercent = Math.min((metric.actual / maxValue) * 100, 100);
          const targetPercent = Math.min((metric.target / maxValue) * 100, 100);
          const goodPercent = (metric.good / maxValue) * 100;
          const satisfactoryPercent = (metric.satisfactory / maxValue) * 100;

          return (
            <div key={idx} className="space-y-2">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="font-medium text-sm">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getStatusLabel(metric.status)}
                  </Badge>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatValue(metric.actual, metric.unit)}
                  </span>
                </div>
              </div>

              {/* Bullet Chart Bar */}
              <div className="relative h-6 rounded overflow-hidden bg-muted">
                {/* Background ranges - stacked from left */}
                <div className="absolute inset-0 flex">
                  <div
                    className="h-full bg-green-100 dark:bg-green-900/30"
                    style={{ width: `${goodPercent}%` }}
                  />
                  <div
                    className="h-full bg-yellow-100 dark:bg-yellow-900/30"
                    style={{ width: `${satisfactoryPercent - goodPercent}%` }}
                  />
                  <div
                    className="h-full bg-red-100 dark:bg-red-900/30"
                    style={{ width: `${100 - satisfactoryPercent}%` }}
                  />
                </div>

                {/* Actual value bar */}
                <div
                  className={`absolute top-1.5 bottom-1.5 left-0 ${getStatusColor(metric.status)} rounded-sm`}
                  style={{ width: `${actualPercent}%` }}
                />

                {/* Target marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground/70"
                  style={{ left: `${targetPercent}%` }}
                />
              </div>

              {/* Legend row */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0{metric.unit === "hours" ? "h" : metric.unit === "%" ? "%" : ""}</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-foreground/70 rounded-sm" />
                  Target: {formatValue(metric.target, metric.unit)}
                </span>
                <span>{formatValue(metric.poor, metric.unit)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Colored bar shows actual value. Vertical line marks target. Background shading: green (good), yellow (satisfactory), red (poor).
        </p>
      </div>
    </Card>
  );
}