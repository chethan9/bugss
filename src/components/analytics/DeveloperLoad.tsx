import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, CheckCircle2 } from "lucide-react";
import type { DeveloperLoadStats } from "@/services/analyticsService";

interface DeveloperLoadProps {
  stats: DeveloperLoadStats;
}

export function DeveloperLoad({ stats }: DeveloperLoadProps) {
  if (stats.developers.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Users className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold">Developer Load</h3>
            <p className="text-xs text-muted-foreground">No assigned issues</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No developers have assigned issues currently.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-semibold">Developer Load</h3>
          <p className="text-xs text-muted-foreground">
            Avg: {stats.averageLoad.toFixed(1)} issues per dev
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {stats.developers.map((dev, idx) => {
          const isOverloaded = dev.status === "overloaded";
          const isUnderutilized = dev.status === "underutilized";
          
          return (
            <div 
              key={idx}
              className={`
                flex items-center justify-between p-3 rounded-lg border
                ${isOverloaded ? "bg-red-50 border-red-200" : 
                  isUnderutilized ? "bg-yellow-50 border-yellow-200" : 
                  "bg-green-50 border-green-200"}
              `}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`
                  text-lg font-bold
                  ${isOverloaded ? "text-red-600" : 
                    isUnderutilized ? "text-yellow-600" : 
                    "text-green-600"}
                `}>
                  {dev.issueCount}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{dev.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`
                        text-[10px] px-1.5 py-0 h-5
                        ${isOverloaded ? "bg-red-100 text-red-700 border-red-300" : 
                          isUnderutilized ? "bg-yellow-100 text-yellow-700 border-yellow-300" : 
                          "bg-green-100 text-green-700 border-green-300"}
                      `}
                    >
                      {dev.status === "overloaded" ? "Overloaded" : 
                       dev.status === "underutilized" ? "Underutilized" : 
                       "Normal"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {((dev.issueCount / stats.averageLoad) * 100).toFixed(0)}% of avg
                    </span>
                  </div>
                </div>
              </div>
              {isOverloaded && <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
              {!isOverloaded && !isUnderutilized && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {stats.developers.some(d => d.status === "overloaded") && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
          <p className="text-xs text-muted-foreground">
            <strong className="text-red-700">Load Imbalance Detected:</strong> Some developers are handling 
            50%+ more issues than average. Consider redistributing work to prevent burnout.
          </p>
        </div>
      )}
    </Card>
  );
}