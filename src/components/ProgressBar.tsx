interface ProgressBarProps {
  open: number;
  inProgress: number;
  closed: number;
  total: number;
}

export function ProgressBar({ open, inProgress, closed, total }: ProgressBarProps) {
  const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;
  
  const segments = [
    { label: "Open", value: open, color: "bg-green-500" },
    { label: "In Progress", value: inProgress, color: "bg-purple-500" },
    { label: "Closed", value: closed, color: "bg-gray-500" },
  ].map(s => ({
    ...s,
    percentage: total > 0 ? (s.value / total) * 100 : 0
  })).filter(s => s.percentage > 0);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Issue Progress</h3>
        <span className="text-sm text-muted-foreground">{completionRate}% completed</span>
      </div>
      
      <div className="w-full h-6 bg-muted rounded-full overflow-hidden flex">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`h-full ${segment.color} transition-all duration-300`}
            style={{ width: `${segment.percentage}%` }}
            title={`${segment.label}: ${Math.round(segment.percentage)}%`}
          />
        ))}
      </div>
      
      <div className="flex flex-wrap gap-4 text-xs">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${segment.color}`} />
            <span className="text-muted-foreground">
              {segment.label} <span className="font-semibold text-foreground">{Math.round(segment.percentage)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}