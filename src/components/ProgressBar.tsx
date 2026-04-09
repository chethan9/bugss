import { Skeleton } from "@/components/ui/skeleton";

interface ProgressBarProps {
  open: number;
  inProgress: number;
  closed: number;
  total: number;
  isLoading?: boolean;
}

export function ProgressBar({ open, inProgress, closed, total, isLoading }: ProgressBarProps) {
  const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;
  
  // Colors: Closed = Green (good), In Progress = Yellow, Open = Red/Orange (needs work)
  const segments = [
    { label: "Closed", value: closed, color: "bg-emerald-500", dotColor: "bg-emerald-500" },
    { label: "In Progress", value: inProgress, color: "bg-amber-500", dotColor: "bg-amber-500" },
    { label: "Open", value: open, color: "bg-rose-500", dotColor: "bg-rose-500" },
  ].map(s => ({
    ...s,
    percentage: total > 0 ? (s.value / total) * 100 : 0
  })).filter(s => s.percentage > 0);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-full rounded-full" />
        <div className="flex gap-6">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Issue Progress</h3>
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {completionRate}% completed
        </span>
      </div>
      
      <div className="w-full h-4 bg-muted/50 rounded-full overflow-hidden flex shadow-inner">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`h-full ${segment.color} transition-all duration-500 ease-out first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${segment.percentage}%` }}
            title={`${segment.label}: ${segment.value} (${Math.round(segment.percentage)}%)`}
          />
        ))}
      </div>
      
      <div className="flex flex-wrap gap-6 text-sm">
        {[
          { label: "Closed", value: closed, percentage: total > 0 ? (closed / total) * 100 : 0, color: "bg-emerald-500", textColor: "text-emerald-600 dark:text-emerald-400" },
          { label: "In Progress", value: inProgress, percentage: total > 0 ? (inProgress / total) * 100 : 0, color: "bg-amber-500", textColor: "text-amber-600 dark:text-amber-400" },
          { label: "Open", value: open, percentage: total > 0 ? (open / total) * 100 : 0, color: "bg-rose-500", textColor: "text-rose-600 dark:text-rose-400" },
        ].map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-muted-foreground">{item.label}</span>
            <span className={`font-semibold ${item.textColor}`}>
              {Math.round(item.percentage)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}