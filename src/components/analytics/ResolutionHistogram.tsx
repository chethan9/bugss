import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { HistogramBucket } from "@/services/analyticsService";

interface ResolutionHistogramProps {
  data: HistogramBucket[];
}

export function ResolutionHistogram({ data }: ResolutionHistogramProps) {
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#dc2626"];
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Resolution Time Distribution</h3>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="range" 
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "count") {
                return [value, "Issues"];
              }
              return [value, name];
            }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-5 gap-2">
        {data.map((bucket, idx) => (
          <div key={bucket.range} className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{bucket.range}</div>
            <div className="text-sm font-semibold">{bucket.count}</div>
            <div className="text-[10px] text-muted-foreground">
              {bucket.percentage.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
      
      <p className="mt-4 text-xs text-muted-foreground">
        Shows how resolution times are distributed. Ideal: Most issues in 0-3 day range. Spike in 14+ days indicates performance problems.
      </p>
    </Card>
  );
}