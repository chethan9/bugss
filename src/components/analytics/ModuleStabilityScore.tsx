import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ModuleStabilityScoreProps {
  stability: Record<string, number>;
}

export function ModuleStabilityScore({ stability }: ModuleStabilityScoreProps) {
  const sortedModules = Object.entries(stability)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 8);

  const getColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold mb-4">🧩 Module Stability Score</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Stability = Closed Issues / Total Issues (lower score = more unstable)
      </p>
      
      <div className="space-y-4">
        {sortedModules.map(([module, score]) => (
          <div key={module} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate flex-1 mr-2">{module}</span>
              <span className={`text-sm font-semibold ${getColor(score)}`}>
                {Math.round(score)}%
              </span>
            </div>
            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(score)} transition-all duration-300`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}