import { Card } from "@/components/ui/card";
import { Filter } from "lucide-react";
import { type FunnelStage } from "@/services/analyticsService";

interface IssueFunnelChartProps {
  stages: FunnelStage[];
}

export function IssueFunnelChart({ stages }: IssueFunnelChartProps) {
  if (stages.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold text-lg">Issue Lifecycle Funnel</h3>
        </div>
        <p className="text-sm text-muted-foreground">No data available.</p>
      </Card>
    );
  }

  // Calculate drop-off rates
  const dropoffs = stages.slice(1).map((stage, i) => {
    const prevStage = stages[i];
    const dropoff = prevStage.count - stage.count;
    const dropoffPercentage = prevStage.count > 0 ? (dropoff / prevStage.count) * 100 : 0;
    return { dropoff, dropoffPercentage };
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="font-heading font-semibold text-lg">Issue Lifecycle Funnel</h3>
      </div>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const width = stage.percentage;
          const dropoffInfo = index > 0 ? dropoffs[index - 1] : null;

          return (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <span className="text-xs text-muted-foreground">
                    ({stage.count} issues · {stage.percentage.toFixed(1)}%)
                  </span>
                </div>
                {dropoffInfo && dropoffInfo.dropoff > 0 && (
                  <span className="text-xs text-orange-600 font-medium">
                    -{dropoffInfo.dropoff} ({dropoffInfo.dropoffPercentage.toFixed(1)}% drop)
                  </span>
                )}
              </div>

              <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                <div
                  className={`h-full flex items-center justify-center text-xs font-medium text-white transition-all ${
                    index === 0
                      ? "bg-blue-500"
                      : index === 1
                      ? "bg-indigo-500"
                      : index === 2
                      ? "bg-purple-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${width}%` }}
                >
                  {stage.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            <strong>Completion Rate:</strong> {stages[stages.length - 1]?.percentage.toFixed(1)}% of reported issues reach closure
          </p>
          <p className="text-xs">
            Watch for large drop-offs between stages - they indicate workflow bottlenecks or abandonment points.
          </p>
        </div>
      </div>
    </Card>
  );
}