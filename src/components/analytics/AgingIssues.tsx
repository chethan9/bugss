import { Card } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AgingIssuesStats } from "@/services/analyticsService";

interface AgingIssuesProps {
  stats: AgingIssuesStats;
}

export function AgingIssues({ stats }: AgingIssuesProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-base">Aging Issues</h3>
          </div>
          {stats.over30Days > 5 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Backlog Rot
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.over7Days}</div>
            <div className="text-xs text-muted-foreground mt-1">&gt; 7 days</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.over30Days}</div>
            <div className="text-xs text-muted-foreground mt-1">&gt; 30 days</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.over90Days}</div>
            <div className="text-xs text-muted-foreground mt-1">&gt; 90 days</div>
          </div>
        </div>

        {stats.oldestIssue && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Oldest Open Issue:</p>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium line-clamp-2 flex-1">
                #{stats.oldestIssue.number} {stats.oldestIssue.title}
              </p>
              <Badge variant="outline" className="shrink-0">
                {stats.oldestDays} days
              </Badge>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {stats.over30Days > 10 
              ? "⚠️ High backlog age indicates neglected issues requiring attention."
              : "✓ Backlog age is healthy. Most issues being addressed timely."}
          </p>
        </div>
      </div>
    </Card>
  );
}