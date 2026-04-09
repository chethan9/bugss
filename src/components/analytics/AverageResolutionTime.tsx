import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { ResolutionTimeStats } from "@/services/analyticsService";

interface AverageResolutionTimeProps {
  stats: ResolutionTimeStats;
}

export function AverageResolutionTime({ stats }: AverageResolutionTimeProps) {
  const formatTime = (hours: number) => {
    if (hours === 0) return "N/A";
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const severityData = [
    { label: "Critical", time: stats.bySeverity.critical, color: "text-red-600" },
    { label: "High", time: stats.bySeverity.high, color: "text-orange-600" },
    { label: "Medium", time: stats.bySeverity.medium, color: "text-amber-600" },
    { label: "Low", time: stats.bySeverity.low, color: "text-green-600" },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">⏱ Average Resolution Time</h3>
      </div>
      
      <div className="mb-6">
        <div className="text-4xl font-heading font-bold text-foreground">
          {formatTime(stats.overall)}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Overall average fix time</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">By Severity:</p>
        {severityData.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className={`text-lg font-semibold ${item.color}`}>
              {formatTime(item.time)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}