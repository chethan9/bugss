import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { BugHotspot } from "@/services/analyticsService";

interface BugHotspotsProps {
  hotspots: BugHotspot[];
}

export function BugHotspots({ hotspots }: BugHotspotsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-300";
      case "high": return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium": return "bg-amber-100 text-amber-800 border-amber-300";
      case "low": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h3 className="text-base font-semibold">⚠️ Bug Hotspots - Top 5 Features</h3>
      </div>

      {hotspots.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No hotspots identified
        </p>
      ) : (
        <div className="space-y-3">
          {hotspots.map((hotspot, index) => (
            <div key={hotspot.feature} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">{hotspot.feature}</p>
                  <p className="text-xs text-muted-foreground">
                    {hotspot.count} issues ({hotspot.percentage.toFixed(1)}% of total)
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={getSeverityColor(hotspot.severity)}>
                {hotspot.severity}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          💡 <span className="font-medium">Insight:</span> These features need urgent attention 
          and testing improvements.
        </p>
      </div>
    </Card>
  );
}