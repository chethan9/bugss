import { Card } from "@/components/ui/card";
import { Radar } from "lucide-react";
import { RadarMetric } from "@/services/analyticsService";

interface ModuleRadarChartProps {
  data: RadarMetric[];
}

export function ModuleRadarChart({ data }: ModuleRadarChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Radar className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold text-foreground">
            🧭 Module Radar Chart
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No module data available for comparison
        </p>
      </Card>
    );
  }

  const metrics = [
    { key: "bugCount", label: "Bug Count", max: Math.max(...data.map(d => d.bugCount)) },
    { key: "avgResolutionTime", label: "Avg Resolution (hrs)", max: Math.max(...data.map(d => d.avgResolutionTime)) },
    { key: "criticalPercentage", label: "Critical %", max: 100 },
    { key: "avgSeverityScore", label: "Severity Score", max: 100 },
    { key: "reopenRate", label: "Reopen Rate %", max: 100 },
  ];

  const colors = [
    "rgb(59, 130, 246)", // blue
    "rgb(239, 68, 68)", // red
    "rgb(34, 197, 94)", // green
    "rgb(168, 85, 247)", // purple
    "rgb(234, 179, 8)", // yellow
  ];

  // Simple radar chart using SVG
  const size = 280;
  const center = size / 2;
  const radius = size / 2 - 40;
  const angleStep = (2 * Math.PI) / metrics.length;

  const getPoint = (metricIndex: number, value: number, max: number) => {
    const angle = metricIndex * angleStep - Math.PI / 2;
    const normalizedValue = max > 0 ? value / max : 0;
    const r = radius * normalizedValue;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const getLabelPoint = (metricIndex: number) => {
    const angle = metricIndex * angleStep - Math.PI / 2;
    const r = radius + 25;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Radar className="h-5 w-5 text-primary" />
        <h3 className="font-heading font-semibold text-foreground">
          🧭 Module Radar Chart
        </h3>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Multi-metric comparison of top {data.length} modules. Larger area = weaker module.
        </p>
      </div>

      {/* SVG Radar Chart */}
      <div className="flex justify-center mb-4">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background grid circles */}
          {[0.25, 0.5, 0.75, 1].map((scale, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius * scale}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-border opacity-30"
            />
          ))}

          {/* Axis lines */}
          {metrics.map((_, i) => {
            const point = getPoint(i, 1, 1);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={point.x}
                y2={point.y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-border opacity-30"
              />
            );
          })}

          {/* Data polygons for each module */}
          {data.map((module, moduleIndex) => {
            const points = metrics
              .map((metric, i) => {
                const value = module[metric.key as keyof RadarMetric] as number;
                const point = getPoint(i, value, metric.max);
                return `${point.x},${point.y}`;
              })
              .join(" ");

            return (
              <g key={module.module}>
                <polygon
                  points={points}
                  fill={colors[moduleIndex % colors.length]}
                  fillOpacity="0.1"
                  stroke={colors[moduleIndex % colors.length]}
                  strokeWidth="2"
                />
                {/* Data points */}
                {metrics.map((metric, i) => {
                  const value = module[metric.key as keyof RadarMetric] as number;
                  const point = getPoint(i, value, metric.max);
                  return (
                    <circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill={colors[moduleIndex % colors.length]}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Metric labels */}
          {metrics.map((metric, i) => {
            const point = getLabelPoint(i);
            return (
              <text
                key={i}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                className="text-xs fill-current text-foreground font-medium"
              >
                {metric.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Module Legend */}
      <div className="space-y-2">
        {data.map((module, i) => (
          <div key={module.module} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors[i % colors.length] }}
              ></div>
              <span className="font-medium text-foreground">{module.module}</span>
            </div>
            <span className="text-muted-foreground">
              {module.bugCount} bugs, {module.avgResolutionTime.toFixed(0)}h avg
            </span>
          </div>
        ))}
      </div>

      {/* Insight */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Insight:</strong> Modules with larger polygons have more issues across multiple metrics. 
          Focus on modules with high critical % and long resolution times.
        </p>
      </div>
    </Card>
  );
}