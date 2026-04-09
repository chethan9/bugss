import { Card } from "@/components/ui/card";
import { AlertOctagon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CriticalUntouchedStats } from "@/services/analyticsService";

interface CriticalUntouchedProps {
  stats: CriticalUntouchedStats;
}

export function CriticalUntouched({ stats }: CriticalUntouchedProps) {
  return (
    <Card className="p-6 border-l-4 border-l-red-500">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-base">Critical Bugs Not Touched</h3>
          </div>
          {stats.count > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-300">
              Needs Escalation
            </Badge>
          )}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-5xl font-bold text-red-600 mb-2">{stats.count}</div>
          <p className="text-sm text-muted-foreground">
            Critical/High bugs untouched for 3+ days
          </p>
          {stats.averageDaysUntouched > 0 && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-red-700">
              <Clock className="h-4 w-4" />
              <span>Avg: {Math.round(stats.averageDaysUntouched)} days untouched</span>
            </div>
          )}
        </div>

        {stats.issues.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Top Neglected Issues:</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stats.issues.map(issue => (
                <div 
                  key={issue.id} 
                  className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded text-xs"
                >
                  <span className="font-mono text-primary">#{issue.number}</span>
                  <span className="flex-1 line-clamp-1">{issue.title}</span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {Math.floor((Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {stats.count > 0 
              ? "🚨 These critical issues require immediate attention and escalation."
              : "✓ All critical bugs are being actively addressed."}
          </p>
        </div>
      </div>
    </Card>
  );
}