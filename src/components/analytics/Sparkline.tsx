import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type SparklineData } from "@/services/analyticsService";

interface SparklineProps {
  data: SparklineData;
  color?: "blue" | "green" | "red" | "gray";
  height?: number;
}

export function Sparkline({ data, color = "blue", height = 24 }: SparklineProps) {
  const { values, trend, change } = data;

  if (values.length === 0) {
    return <div className="text-xs text-muted-foreground">No data</div>;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  // Generate SVG path for sparkline
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(" L ")}`;

  const colorMap = {
    blue: "stroke-blue-500",
    green: "stroke-green-500",
    red: "stroke-red-500",
    gray: "stroke-gray-500",
  };

  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-2">
      <svg
        width="60"
        height={height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="flex-shrink-0"
      >
        <path
          d={pathData}
          fill="none"
          className={`${colorMap[color]} stroke-2`}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-center gap-1">
        <TrendIcon className={`h-3 w-3 ${trendColor}`} />
        <span className={`text-xs font-medium ${trendColor}`}>
          {change > 0 ? "+" : ""}{change.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}