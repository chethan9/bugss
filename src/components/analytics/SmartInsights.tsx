import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { SmartInsight } from "@/services/analyticsService";

interface SmartInsightsProps {
  insights: SmartInsight[];
}

export function SmartInsights({ insights }: SmartInsightsProps) {
  if (insights.length === 0) return null;

  const getIcon = (type: SmartInsight["type"]) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (type: SmartInsight["type"]) => {
    switch (type) {
      case "warning":
        return "destructive";
      case "success":
        return "default";
      case "info":
        return "default";
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-heading font-semibold">🚨 Smart Insights</h2>
      <div className="space-y-2">
        {insights.map((insight, index) => (
          <Alert key={index} variant={getVariant(insight.type)} className="py-3">
            {getIcon(insight.type)}
            <AlertDescription className="ml-2">{insight.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
}