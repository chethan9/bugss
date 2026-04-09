import { Card } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";
import { TreemapNode } from "@/services/analyticsService";

interface ModuleTreemapProps {
  data: TreemapNode[];
}

export function ModuleTreemap({ data }: ModuleTreemapProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold text-foreground">
            🌳 Module Treemap
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No module data available
        </p>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/80 hover:bg-red-500";
      case "high":
        return "bg-orange-500/80 hover:bg-orange-500";
      case "medium":
        return "bg-yellow-500/80 hover:bg-yellow-500";
      case "low":
        return "bg-green-500/80 hover:bg-green-500";
      default:
        return "bg-gray-500/80 hover:bg-gray-500";
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-600";
      case "high":
        return "border-orange-600";
      case "medium":
        return "border-yellow-600";
      case "low":
        return "border-green-600";
      default:
        return "border-gray-600";
    }
  };

  // Calculate sizes for treemap layout (simple grid-based)
  const total = data.reduce((sum, node) => sum + node.value, 0);
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="h-5 w-5 text-primary" />
        <h3 className="font-heading font-semibold text-foreground">
          🌳 Module Treemap
        </h3>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">
          Visual representation of module bug distribution. Size = bug count, Color = dominant severity.
        </p>
      </div>

      {/* Treemap Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4" style={{ minHeight: "280px" }}>
        {data.slice(0, 8).map((node, index) => {
          const heightRatio = Math.max(0.3, Math.min(1, node.percentage / 25));
          const colSpan = index === 0 ? 2 : 1;
          const rowSpan = heightRatio > 0.6 ? 2 : 1;
          
          return (
            <div
              key={node.name}
              className={`${getSeverityColor(node.severity)} ${getSeverityBorderColor(node.severity)} 
                         border-2 rounded-lg p-3 flex flex-col justify-center items-center
                         transition-all cursor-pointer group`}
              style={{
                gridColumn: `span ${colSpan}`,
                gridRow: `span ${rowSpan}`,
                minHeight: "80px",
              }}
              title={`${node.name}: ${node.value} issues (${node.percentage.toFixed(1)}%)`}
            >
              <p className="text-xs font-medium text-white text-center mb-1 line-clamp-2 group-hover:line-clamp-none">
                {node.name}
              </p>
              <p className="text-xl font-bold text-white">
                {node.value}
              </p>
              <p className="text-xs text-white/90">
                {node.percentage.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-xs text-muted-foreground">Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-xs text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-500"></div>
          <span className="text-xs text-muted-foreground">Mixed</span>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Insight:</strong> Larger boxes = more bugs. Red boxes = critical priority. 
          Focus on large red/orange boxes first for maximum impact.
        </p>
      </div>
    </Card>
  );
}