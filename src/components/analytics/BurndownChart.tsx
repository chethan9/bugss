import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Target, Calendar } from "lucide-react";
import { useMemo } from "react";

interface BurndownChartProps {
  issues: Array<{
    createdAt: string;
    closedAt?: string | null;
    status: string;
  }>;
  sprintDays?: number;
}

export function BurndownChart({ issues, sprintDays = 14 }: BurndownChartProps) {
  const chartData = useMemo(() => {
    if (issues.length === 0) return { days: [], ideal: [], actual: [], projection: null };

    // Get date range
    const now = new Date();
    const startDate = new Date(now.getTime() - sprintDays * 24 * 60 * 60 * 1000);
    
    // Calculate daily data
    const days: string[] = [];
    const actual: number[] = [];
    const ideal: number[] = [];
    
    // Get initial count at sprint start
    const issuesAtStart = issues.filter(i => new Date(i.createdAt) <= startDate).length;
    const closedAtStart = issues.filter(i => i.closedAt && new Date(i.closedAt) <= startDate).length;
    const initialOpen = issuesAtStart - closedAtStart;
    
    // Total issues to close (initial open + new during sprint)
    const totalToClose = issues.filter(i => 
      new Date(i.createdAt) <= now && 
      (new Date(i.createdAt) >= startDate || !i.closedAt || new Date(i.closedAt!) >= startDate)
    ).length;
    
    const idealDailyBurn = totalToClose / sprintDays;
    
    for (let i = 0; i <= sprintDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      if (date > now) break;
      
      days.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      
      // Ideal line
      ideal.push(Math.max(0, totalToClose - (idealDailyBurn * i)));
      
      // Actual remaining
      const openAtDate = issues.filter(issue => {
        const created = new Date(issue.createdAt);
        const closed = issue.closedAt ? new Date(issue.closedAt) : null;
        return created <= date && (!closed || closed > date);
      }).length;
      
      actual.push(openAtDate);
    }
    
    // Calculate projection
    let projection = null;
    if (actual.length >= 2) {
      const recentActual = actual.slice(-7);
      if (recentActual.length >= 2) {
        const avgBurnRate = (recentActual[0] - recentActual[recentActual.length - 1]) / recentActual.length;
        if (avgBurnRate > 0) {
          const currentOpen = actual[actual.length - 1];
          const daysToComplete = Math.ceil(currentOpen / avgBurnRate);
          projection = daysToComplete;
        }
      }
    }
    
    return { days, ideal, actual, projection };
  }, [issues, sprintDays]);

  const currentRemaining = chartData.actual[chartData.actual.length - 1] || 0;
  const idealRemaining = chartData.ideal[chartData.ideal.length - 1] || 0;
  const isAhead = currentRemaining < idealRemaining;
  const maxValue = Math.max(...chartData.actual, ...chartData.ideal, 1);

  // SVG dimensions
  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => padding.left + (index / Math.max(chartData.days.length - 1, 1)) * chartWidth;
  const getY = (value: number) => padding.top + (1 - value / maxValue) * chartHeight;

  const idealPath = chartData.ideal.map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(v)}`).join(" ");
  const actualPath = chartData.actual.map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(v)}`).join(" ");

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Sprint Burndown</h3>
        <Badge variant={isAhead ? "default" : "destructive"} className="ml-auto">
          {isAhead ? "On Track" : "Behind"}
        </Badge>
      </div>

      {/* Chart */}
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <g key={pct}>
              <line
                x1={padding.left}
                y1={padding.top + (1 - pct) * chartHeight}
                x2={width - padding.right}
                y2={padding.top + (1 - pct) * chartHeight}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="4,4"
              />
              <text
                x={padding.left - 8}
                y={padding.top + (1 - pct) * chartHeight + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {Math.round(maxValue * pct)}
              </text>
            </g>
          ))}

          {/* Ideal line */}
          <path
            d={idealPath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="6,4"
          />

          {/* Actual line */}
          <path
            d={actualPath}
            fill="none"
            stroke={isAhead ? "#22c55e" : "#ef4444"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.actual.map((v, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(v)}
              r="4"
              fill={isAhead ? "#22c55e" : "#ef4444"}
            />
          ))}

          {/* X-axis labels */}
          {chartData.days.filter((_, i) => i % Math.ceil(chartData.days.length / 5) === 0 || i === chartData.days.length - 1).map((day, i, arr) => {
            const originalIndex = chartData.days.indexOf(day);
            return (
              <text
                key={day}
                x={getX(originalIndex)}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {day}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-slate-400" style={{ borderStyle: "dashed" }} />
          <span className="text-muted-foreground">Ideal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-1 rounded ${isAhead ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-muted-foreground">Actual</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-center">
        <div>
          <div className="text-2xl font-bold">{currentRemaining}</div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${isAhead ? "text-green-500" : "text-red-500"}`}>
            {isAhead ? "-" : "+"}{Math.abs(currentRemaining - idealRemaining)}
          </div>
          <div className="text-xs text-muted-foreground">vs Ideal</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {chartData.projection ? `${chartData.projection}d` : "—"}
          </div>
          <div className="text-xs text-muted-foreground">Est. Complete</div>
        </div>
      </div>

      {chartData.projection && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span>
            At current pace, backlog clears in <strong>{chartData.projection} days</strong>
          </span>
        </div>
      )}
    </Card>
  );
}