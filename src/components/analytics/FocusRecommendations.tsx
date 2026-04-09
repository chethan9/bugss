import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, AlertTriangle } from "lucide-react";
import type { FocusRecommendation } from "@/services/analyticsService";

interface FocusRecommendationsProps {
  recommendations: FocusRecommendation[];
}

export function FocusRecommendations({ recommendations }: FocusRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Lightbulb className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold">Focus Recommendations</h3>
            <p className="text-xs text-muted-foreground">AI-powered insights</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No critical focus areas detected. Your project is in good health!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Lightbulb className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-heading font-semibold">Focus Recommendations</h3>
          <p className="text-xs text-muted-foreground">
            {recommendations.length} area{recommendations.length !== 1 ? "s" : ""} need attention
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const priorityColors = {
            urgent: {
              bg: "bg-red-50",
              border: "border-red-200",
              badge: "bg-red-100 text-red-700 border-red-300",
              icon: "text-red-600",
            },
            high: {
              bg: "bg-orange-50",
              border: "border-orange-200",
              badge: "bg-orange-100 text-orange-700 border-orange-300",
              icon: "text-orange-600",
            },
            medium: {
              bg: "bg-yellow-50",
              border: "border-yellow-200",
              badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
              icon: "text-yellow-600",
            },
          };

          const colors = priorityColors[rec.priority];

          return (
            <div 
              key={idx}
              className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-3">
                <Target className={`h-5 w-5 mt-0.5 flex-shrink-0 ${colors.icon}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{rec.area}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 h-5 ${colors.badge}`}
                    >
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground min-w-[60px]">
                        Issue:
                      </span>
                      <span className="text-xs text-foreground">{rec.reason}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground min-w-[60px]">
                        Impact:
                      </span>
                      <span className="text-xs text-foreground">{rec.impact}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                        {rec.issueCount} issue{rec.issueCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
        <p className="text-xs text-muted-foreground">
          <strong className="text-purple-700">💡 AI Insight:</strong> These recommendations are generated 
          from data patterns. Addressing urgent items first will have the highest impact on project health.
        </p>
      </div>
    </Card>
  );
}