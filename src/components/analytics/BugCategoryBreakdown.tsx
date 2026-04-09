import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { CategoryCount } from "@/services/analyticsService";

interface BugCategoryBreakdownProps {
  categories: CategoryCount;
}

export function BugCategoryBreakdown({ categories }: BugCategoryBreakdownProps) {
  const data = [
    { name: "UI/Design", value: categories.ui, color: "#3B82F6" },
    { name: "Validation", value: categories.validation, color: "#8B5CF6" },
    { name: "API", value: categories.api, color: "#EC4899" },
    { name: "Backend", value: categories.backend, color: "#F59E0B" },
    { name: "Frontend", value: categories.frontend, color: "#10B981" },
    { name: "Performance", value: categories.performance, color: "#EF4444" },
    { name: "Security", value: categories.security, color: "#DC2626" },
    { name: "Other", value: categories.other, color: "#6B7280" },
  ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold mb-4">🧪 Bug Category Breakdown</h3>
      
      {total === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No categorized bugs found
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">
                  {item.name}: <span className="font-semibold text-foreground">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}