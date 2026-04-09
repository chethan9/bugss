import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AtRiskReleaseStats } from "@/services/analyticsService";

interface AtRiskReleaseProps {
  stats: AtRiskReleaseStats;
}

export function AtRiskRelease({ stats }: AtRiskReleaseProps) {
  const getStatusConfig = () => {
    switch (stats.status) {
      case "critical":
        return {
          icon: AlertTriangle,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          badge: "bg-red-100 text-red-700 border-red-300",
          message: "High Release Risk",
        };
      case "warning":
        return {
          icon: AlertCircle,
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
          badge: "bg-amber-100 text-amber-700 border-amber-300",
          message: "Moderate Release Risk",
        };
      default:
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
          badge: "bg-green-100 text-green-700 border-green-300",
          message: "Safe to Release",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className="p-6 border-l-4" style={{ borderLeftColor: config.color.replace('text-', '') }}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <h3 className="font-semibold text-base">Release Risk Indicator</h3>
          </div>
          <Badge className={config.badge}>
            {config.message}
          </Badge>
        </div>

        <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
          <div className="text-center">
            <div className={`text-4xl font-bold ${config.color} mb-2`}>
              {Math.round(stats.riskPercentage)}%
            </div>
            <p className="text-sm text-muted-foreground">
              Critical + High bugs still open
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Critical Open</p>
            <p className="text-2xl font-semibold text-red-600">{stats.criticalOpen}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">High Open</p>
            <p className="text-2xl font-semibold text-amber-600">{stats.highOpen}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {stats.status === "safe" 
              ? "All critical issues resolved. Safe to proceed with release."
              : stats.status === "warning"
              ? "Some high-priority issues remain. Review before releasing."
              : "Too many critical issues open. DO NOT release until resolved."}
          </p>
        </div>
      </div>
    </Card>
  );
}