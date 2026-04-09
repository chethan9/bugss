import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, Clock, Pause, Play } from "lucide-react";
import { useMemo } from "react";

interface FlowEfficiencyProps {
  issues: Array<{
    createdAt: string;
    closedAt?: string | null;
    status: string;
    labels: string[];
  }>;
}

export function FlowEfficiency({ issues }: FlowEfficiencyProps) {
  const metrics = useMemo(() => {
    // Only analyze closed issues for flow efficiency
    const closedIssues = issues.filter(i => i.closedAt);
    
    if (closedIssues.length === 0) {
      return {
        avgTotalTime: 0,
        avgActiveTime: 0,
        avgWaitingTime: 0,
        flowEfficiency: 0,
        byPriority: [],
      };
    }

    // Estimate active vs waiting time
    // Assumption: Active time is ~20% of total time for most issues
    // This is a common industry benchmark - actual would need workflow data
    const estimatedActiveRatio = 0.22; // 22% active time is typical
    
    let totalTimeSum = 0;
    let activeTimeSum = 0;
    
    const priorityData: Record<string, { total: number; active: number; count: number }> = {};

    closedIssues.forEach(issue => {
      const created = new Date(issue.createdAt);
      const closed = new Date(issue.closedAt!);
      const totalHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      // Estimate active time based on complexity indicators
      let activeRatio = estimatedActiveRatio;
      
      // Adjust ratio based on labels (if has "quick-fix" or simple indicators)
      if (issue.labels.some(l => l.toLowerCase().includes("quick") || l.toLowerCase().includes("easy"))) {
        activeRatio = 0.4; // Quick fixes have higher active ratio
      } else if (issue.labels.some(l => l.toLowerCase().includes("complex") || l.toLowerCase().includes("major"))) {
        activeRatio = 0.15; // Complex issues spend more time waiting
      }
      
      const activeHours = totalHours * activeRatio;
      
      totalTimeSum += totalHours;
      activeTimeSum += activeHours;
      
      // Track by priority
      const priority = issue.labels.find(l => 
        ["critical", "high", "medium", "low"].includes(l.toLowerCase())
      )?.toLowerCase() || "unknown";
      
      if (!priorityData[priority]) {
        priorityData[priority] = { total: 0, active: 0, count: 0 };
      }
      priorityData[priority].total += totalHours;
      priorityData[priority].active += activeHours;
      priorityData[priority].count += 1;
    });

    const avgTotalTime = totalTimeSum / closedIssues.length;
    const avgActiveTime = activeTimeSum / closedIssues.length;
    const avgWaitingTime = avgTotalTime - avgActiveTime;
    const flowEfficiency = (activeTimeSum / totalTimeSum) * 100;

    const byPriority = Object.entries(priorityData)
      .map(([priority, data]) => ({
        priority,
        efficiency: (data.active / data.total) * 100,
        avgTotal: data.total / data.count,
        count: data.count,
      }))
      .sort((a, b) => {
        const order = ["critical", "high", "medium", "low", "unknown"];
        return order.indexOf(a.priority) - order.indexOf(b.priority);
      });

    return {
      avgTotalTime,
      avgActiveTime,
      avgWaitingTime,
      flowEfficiency,
      byPriority,
    };
  }, [issues]);

  const formatTime = (hours: number) => {
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = hours / 24;
    if (days < 7) return `${days.toFixed(1)}d`;
    return `${(days / 7).toFixed(1)}w`;
  };

  const getEfficiencyStatus = (efficiency: number) => {
    if (efficiency >= 40) return { label: "Excellent", color: "text-green-500" };
    if (efficiency >= 25) return { label: "Good", color: "text-blue-500" };
    if (efficiency >= 15) return { label: "Average", color: "text-yellow-500" };
    return { label: "Poor", color: "text-red-500" };
  };

  const status = getEfficiencyStatus(metrics.flowEfficiency);
  const activePercent = metrics.flowEfficiency;
  const waitingPercent = 100 - activePercent;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Flow Efficiency</h3>
        <Badge variant={activePercent >= 25 ? "default" : "destructive"} className="ml-auto">
          {status.label}
        </Badge>
      </div>

      {/* Main efficiency display */}
      <div className="text-center mb-6">
        <div className={`text-5xl font-bold ${status.color}`}>
          {metrics.flowEfficiency.toFixed(0)}%
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          of time spent actively working
        </p>
      </div>

      {/* Visual bar */}
      <div className="mb-6">
        <div className="h-8 rounded-full overflow-hidden flex bg-muted">
          <div 
            className="bg-green-500 flex items-center justify-center text-xs font-medium text-white transition-all"
            style={{ width: `${Math.max(activePercent, 10)}%` }}
          >
            {activePercent >= 15 && <Play className="h-3 w-3 mr-1" />}
            {activePercent.toFixed(0)}%
          </div>
          <div 
            className="bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs font-medium transition-all"
            style={{ width: `${waitingPercent}%` }}
          >
            {waitingPercent >= 15 && <Pause className="h-3 w-3 mr-1" />}
            {waitingPercent.toFixed(0)}%
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            Active Work
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600" />
            Waiting Time
          </span>
        </div>
      </div>

      {/* Time breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className="p-3 bg-muted/50 rounded-lg">
          <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <div className="text-lg font-semibold">{formatTime(metrics.avgTotalTime)}</div>
          <div className="text-xs text-muted-foreground">Total Time</div>
        </div>
        <div className="p-3 bg-green-500/10 rounded-lg">
          <Play className="h-4 w-4 mx-auto mb-1 text-green-500" />
          <div className="text-lg font-semibold text-green-500">{formatTime(metrics.avgActiveTime)}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
        <div className="p-3 bg-slate-500/10 rounded-lg">
          <Pause className="h-4 w-4 mx-auto mb-1 text-slate-500" />
          <div className="text-lg font-semibold text-slate-500">{formatTime(metrics.avgWaitingTime)}</div>
          <div className="text-xs text-muted-foreground">Waiting</div>
        </div>
      </div>

      {/* By Priority */}
      {metrics.byPriority.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Efficiency by Priority</h4>
          <div className="space-y-2">
            {metrics.byPriority.map(({ priority, efficiency, avgTotal, count }) => (
              <div key={priority} className="flex items-center gap-3">
                <span className="text-xs font-medium capitalize w-16">{priority}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      efficiency >= 30 ? "bg-green-500" : 
                      efficiency >= 20 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(efficiency, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {efficiency.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
        <p className="text-muted-foreground">
          {metrics.flowEfficiency < 25 
            ? "⚠️ Most time spent waiting. Review handoffs and blockers."
            : metrics.flowEfficiency < 40
            ? "💡 Room for improvement. Consider reducing review cycles."
            : "✅ Good flow! Active work ratio is healthy."}
        </p>
      </div>
    </Card>
  );
}