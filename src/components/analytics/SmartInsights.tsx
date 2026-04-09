import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useState } from "react";

export interface SmartInsight {
  type: "warning" | "success" | "info";
  message: string;
  severity: "high" | "medium" | "low";
}

interface SmartInsightsProps {
  insights: SmartInsight[];
}

export function SmartInsights({ insights }: SmartInsightsProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const handleDismiss = (index: number) => {
    setDismissed(new Set([...dismissed, index]));
  };

  const visibleInsights = insights.filter((_, index) => !dismissed.has(index));

  if (visibleInsights.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Smart Insights
      </h2>
      <div className="space-y-2">
        {visibleInsights.map((insight, index) => (
          <Alert
            key={index}
            variant={insight.type === "warning" ? "destructive" : "default"}
            className={`
              relative py-3 px-4 border-l-4 rounded-lg transition-smooth
              ${insight.type === "warning" 
                ? "bg-red-50 border-red-500 text-red-700" 
                : insight.type === "success"
                ? "bg-green-50 border-green-500 text-green-700"
                : "bg-blue-50 border-blue-500 text-blue-700"
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {insight.type === "warning" && <AlertCircle className="h-4 w-4" />}
                {insight.type === "success" && <CheckCircle2 className="h-4 w-4" />}
                {insight.type === "info" && <Info className="h-4 w-4" />}
              </div>
              <AlertDescription className="flex-1 text-sm font-medium">
                {insight.message}
              </AlertDescription>
              <button
                onClick={() => handleDismiss(insights.indexOf(insight))}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
}