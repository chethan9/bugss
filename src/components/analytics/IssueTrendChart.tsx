import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { TrendDataPoint } from "@/services/analyticsService";

interface IssueTrendChartProps {
  data: TrendDataPoint[];
  days: number;
}

export function IssueTrendChart({ data, days }: IssueTrendChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold mb-4">📈 Issue Trend - Last {days} Days</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#FFFFFF", 
              border: "1px solid #E5E7EB",
              borderRadius: "6px"
            }}
            labelFormatter={(label) => `Date: ${formatDate(label)}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="created" 
            stroke="#EF4444" 
            strokeWidth={2}
            name="Created"
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="closed" 
            stroke="#10B981" 
            strokeWidth={2}
            name="Closed"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}