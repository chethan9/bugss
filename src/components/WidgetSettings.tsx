import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2 } from "lucide-react";

export interface WidgetVisibility {
  smartInsights: boolean;
  summaryMetrics: boolean;
  progressBar: boolean;
  severityHeatmap: boolean;
  resolutionTime: boolean;
  trendChart: boolean;
  moduleStability: boolean;
  reopenedIssues: boolean;
  categoryBreakdown: boolean;
  bugHotspots: boolean;
}

const DEFAULT_VISIBILITY: WidgetVisibility = {
  smartInsights: true,
  summaryMetrics: true,
  progressBar: true,
  severityHeatmap: true,
  resolutionTime: true,
  trendChart: true,
  moduleStability: true,
  reopenedIssues: true,
  categoryBreakdown: true,
  bugHotspots: true,
};

interface WidgetSettingsProps {
  visibility: WidgetVisibility;
  onVisibilityChange: (visibility: WidgetVisibility) => void;
}

export function WidgetSettings({ visibility, onVisibilityChange }: WidgetSettingsProps) {
  const handleToggle = (key: keyof WidgetVisibility) => {
    onVisibilityChange({
      ...visibility,
      [key]: !visibility[key],
    });
  };

  const handleResetDefaults = () => {
    onVisibilityChange(DEFAULT_VISIBILITY);
  };

  const widgets = [
    { key: "smartInsights" as const, label: "Smart Insights" },
    { key: "summaryMetrics" as const, label: "Summary Metrics" },
    { key: "progressBar" as const, label: "Progress Bar" },
    { key: "severityHeatmap" as const, label: "Bug Severity Heatmap" },
    { key: "resolutionTime" as const, label: "Average Resolution Time" },
    { key: "trendChart" as const, label: "Issue Trend Chart" },
    { key: "moduleStability" as const, label: "Module Stability Score" },
    { key: "reopenedIssues" as const, label: "Reopened Issues Tracker" },
    { key: "categoryBreakdown" as const, label: "Bug Category Breakdown" },
    { key: "bugHotspots" as const, label: "Bug Hotspots" },
  ];

  const visibleCount = Object.values(visibility).filter(Boolean).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Widget Settings
          <span className="text-xs text-muted-foreground">
            ({visibleCount}/{widgets.length})
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Customize Widgets</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            className="h-auto py-1 px-2 text-xs"
          >
            Reset
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
          {widgets.map((widget) => (
            <DropdownMenuItem
              key={widget.key}
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                handleToggle(widget.key);
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <Checkbox
                  checked={visibility[widget.key]}
                  onCheckedChange={() => handleToggle(widget.key)}
                />
                <span className="text-sm">{widget.label}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DEFAULT_VISIBILITY };