import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { type StackedAreaDataPoint } from "@/services/analyticsService";

interface StackedAreaChartProps {
  data: StackedAreaDataPoint[];
}

export function StackedAreaChart({ data }: StackedAreaChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold text-lg">Issue Flow by Category</h3>
        </div>
        <p className="text-sm text-muted-foreground">No data available for the selected period.</p>
      </Card>
    );
  }

  // Calculate maximum stack height for scaling
  const maxStackHeight = Math.max(
    ...data.map(d => d.bug + d.enhancement + d.documentation + d.other)
  );

  // Calculate totals for legend
  const totals = data.reduce(
    (acc, d) => ({
      bug: acc.bug + d.bug,
      enhancement: acc.enhancement + d.enhancement,
      documentation: acc.documentation + d.documentation,
      other: acc.other + d.other,
    }),
    { bug: 0, enhancement: 0, documentation: 0, other: 0 }
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold text-lg">Issue Flow by Category</h3>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500"></div>
            <span className="text-muted-foreground">Bugs ({totals.bug})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
            <span className="text-muted-foreground">Features ({totals.enhancement})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
            <span className="text-muted-foreground">Docs ({totals.documentation})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-400"></div>
            <span className="text-muted-foreground">Other ({totals.other})</span>
          </div>
        </div>
      </div>

      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
          {/* Stacked areas */}
          {data.length > 1 && (
            <>
              {/* Other (bottom layer) */}
              <path
                d={data.map((d, i) => {
                  const x = (i / (data.length - 1)) * 800;
                  const y = 200 - (d.other / maxStackHeight) * 180;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ") + ` L 800 200 L 0 200 Z`}
                fill="rgb(156, 163, 175)"
                opacity="0.6"
              />
              
              {/* Documentation */}
              <path
                d={data.map((d, i) => {
                  const x = (i / (data.length - 1)) * 800;
                  const y = 200 - ((d.other + d.documentation) / maxStackHeight) * 180;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ") + 
                " " +
                data.slice().reverse().map((d, i) => {
                  const x = ((data.length - 1 - i) / (data.length - 1)) * 800;
                  const y = 200 - (d.other / maxStackHeight) * 180;
                  return `L ${x} ${y}`;
                }).join(" ") + " Z"}
                fill="rgb(34, 197, 94)"
                opacity="0.7"
              />
              
              {/* Enhancement */}
              <path
                d={data.map((d, i) => {
                  const x = (i / (data.length - 1)) * 800;
                  const y = 200 - ((d.other + d.documentation + d.enhancement) / maxStackHeight) * 180;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ") + 
                " " +
                data.slice().reverse().map((d, i) => {
                  const x = ((data.length - 1 - i) / (data.length - 1)) * 800;
                  const y = 200 - ((d.other + d.documentation) / maxStackHeight) * 180;
                  return `L ${x} ${y}`;
                }).join(" ") + " Z"}
                fill="rgb(59, 130, 246)"
                opacity="0.8"
              />
              
              {/* Bug (top layer) */}
              <path
                d={data.map((d, i) => {
                  const x = (i / (data.length - 1)) * 800;
                  const y = 200 - ((d.other + d.documentation + d.enhancement + d.bug) / maxStackHeight) * 180;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ") + 
                " " +
                data.slice().reverse().map((d, i) => {
                  const x = ((data.length - 1 - i) / (data.length - 1)) * 800;
                  const y = 200 - ((d.other + d.documentation + d.enhancement) / maxStackHeight) * 180;
                  return `L ${x} ${y}`;
                }).join(" ") + " Z"}
                fill="rgb(239, 68, 68)"
                opacity="0.9"
              />
            </>
          )}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
          <span>{maxStackHeight}</span>
          <span>{Math.floor(maxStackHeight / 2)}</span>
          <span>0</span>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground mt-2">
          <span>{new Date(data[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          {data.length > 2 && (
            <span>{new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          )}
          <span>{new Date(data[data.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Shows the composition and flow of issues by category over time. Look for category spikes or shifts in distribution.
        </p>
      </div>
    </Card>
  );
}