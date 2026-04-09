import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SeverityCount } from "@/services/analyticsService";

interface BugSeverityHeatmapProps {
  severities: SeverityCount;
}

export function BugSeverityHeatmap({ severities }: BugSeverityHeatmapProps) {
  const data = [
    { name: "Critical", count: severities.critical, color: "#DC2626" },
    { name: "High", count: severities.high, color: "#EA580C" },
    { name: "Medium", count: severities.medium, color: "#D97706" },
    { name: "Low", count: severities.low, color: "#65A30D" },
    { name: "Unknown", count: severities.unknown, color: "#6B7280" },
  ].filter(item => item.count > 0);

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold mb-4">🔥 Bug Severity Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#FFFFFF", 
              border: "1px solid #E5E7EB",
              borderRadius: "6px"
            }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">
              {item.name}: <span className="font-semibold text-foreground">{item.count}</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}