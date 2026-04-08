interface ProgressBarProps {
  segments: Array<{
    percentage: number;
    color: string;
    label: string;
  }>;
  completionRate: number;
}

export function ProgressBar({ segments, completionRate }: ProgressBarProps) {
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
            title={`${segment.label}: ${segment.percentage}%`}
          />
        ))}
      </div>
      
      <div className="flex flex-wrap gap-4 text-xs">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${segment.color}`} />
            <span className="text-muted-foreground">
              {segment.label} <span className="font-semibold text-foreground">{segment.percentage}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}