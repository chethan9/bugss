import { Card } from "@/components/ui/card";
import { GitPullRequest } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import type { ScatterDataPoint } from "@/services/analyticsService";

interface PriorityScatterPlotProps {
  data: ScatterDataPoint[];
}

export function PriorityScatterPlot({ data }: PriorityScatterPlotProps) {
  const priorityLabels = ["Low", "Medium", "High", "Critical"];
  
  // Group data by severity for color coding
  const severityColors: Record<string, string> = {
    low: "#10b981",
    medium: "#3b82f6",
    high: "#f59e0b",
    critical: "#ef4444",
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <GitPullRequest className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Priority vs Resolution Time</h3>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number"
            dataKey="priority"
            name="Priority"
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
            ticks={[0, 1, 2, 3]}
            tickFormatter={(value) => priorityLabels[value]}
            domain={[-0.5, 3.5]}
          />
          <YAxis 
            type="number"
            dataKey="resolutionDays"
            name="Resolution Days"
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
          />
          <ZAxis range={[50, 200]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: any, name: string) => {
              if (name === "priority") {
                return [priorityLabels[value as number], "Priority"];
              }
              if (name === "resolutionDays") {
                return [`${value} days`, "Resolution Time"];
              }
              return [value, name];
            }}
            labelFormatter={(label, payload: any) => {
              if (payload && payload.length > 0) {
                const item = payload[0].payload as ScatterDataPoint;
                return `#${item.number}: ${item.title.slice(0, 40)}...`;
              }
              return "";
            }}
          />
          {Object.entries(severityColors).map(([severity, color]) => (
            <Scatter
              key={severity}
              name={severity}
              data={data.filter(d => d.severity === severity)}
              fill={color}
              opacity={0.6}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Low</span>
        </div>
      </div>
      
      <p className="mt-4 text-xs text-muted-foreground">
        Correlation analysis: Are high-priority bugs fixed faster? Ideal pattern: Critical/High bugs cluster in lower resolution time. Outliers indicate priority misalignment.
      </p>
    </Card>
  );
}