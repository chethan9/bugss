import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { RepeatBugStats } from "@/services/analyticsService";

interface RepeatBugDetectorProps {
  stats: RepeatBugStats;
}

export function RepeatBugDetector({ stats }: RepeatBugDetectorProps) {
  if (stats.topRepeatingLabels.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <RefreshCw className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold">Repeat Bug Detector</h3>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No repeat patterns detected. Good quality control!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-100 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-heading font-semibold">Repeat Bug Detector</h3>
          <p className="text-xs text-muted-foreground">Last 7 days • Systemic issues</p>
        </div>
      </div>

      <div className="space-y-3">
        {stats.topRepeatingLabels.map((item, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-orange-600">
                {item.count}×
              </div>
              <div>
                <Badge variant="outline" className="bg-white text-xs">
                  {item.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Repeating pattern detected
                </p>
              </div>
            </div>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
        <p className="text-xs text-muted-foreground">
          <strong className="text-orange-700">Systemic Issue Alert:</strong> These labels appear {stats.totalRepeats} times total. 
          Consider root cause analysis and preventive measures.
        </p>
      </div>
    </Card>
  );
}