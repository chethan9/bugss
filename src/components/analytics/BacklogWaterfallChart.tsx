import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { type WaterfallDataPoint } from "@/services/analyticsService";

interface BacklogWaterfallChartProps {
  data: WaterfallDataPoint[];
}

export function BacklogWaterfallChart({ data }: BacklogWaterfallChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold text-lg">Backlog Waterfall</h3>
        </div>
        <p className="text-sm text-muted-foreground">No data available for the selected period.</p>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
  const netChange = data.find(d => d.isTotal);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold text-lg">Backlog Waterfall</h3>
        </div>
        {netChange && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            netChange.type === "positive"
              ? "bg-red-100 text-red-700"
              : netChange.type === "negative"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}>
            {netChange.type === "positive" ? (
              <TrendingUp className="h-4 w-4" />
            ) : netChange.type === "negative" ? (
              <TrendingDown className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
            <span>
              {netChange.value > 0 ? "+" : ""}{netChange.value} net change
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {data.filter(d => !d.isTotal).map((item, index) => {
          const percentage = maxValue > 0 ? (Math.abs(item.value) / maxValue) * 100 : 0;
          const isPositive = item.type === "positive";

          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-32 text-xs font-medium text-right truncate">
                {item.label}
              </div>
              
              <div className="flex-1 flex items-center gap-2">
                {isPositive ? (
                  <>
                    <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden flex items-center">
                      <div
                        className="h-full bg-red-500 flex items-center justify-end px-3"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-xs font-medium text-white">
                          +{item.value}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden flex items-center justify-end">
                      <div
                        className="h-full bg-green-500 flex items-center justify-start px-3"
                        style={{ width: `${percentage}%`, marginLeft: "auto" }}
                      >
                        <span className="text-xs font-medium text-white">
                          {item.value}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Green</strong> bars show issues closed (reducing backlog). <strong>Red</strong> bars show new issues created (increasing backlog).
          Net positive = backlog growing. Net negative = backlog shrinking.
        </p>
      </div>
    </Card>
  );
}