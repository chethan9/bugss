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
  DropdownMenuCheckboxItem,
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
  atRiskRelease: boolean;
  agingIssues: boolean;
  criticalUntouched: boolean;
  backlogGrowth: boolean;
  bugFixEfficiency: boolean;
  repeatBugDetector: boolean;
  developerLoad: boolean;
  focusRecommendations: boolean;
  bugHeatmap: boolean;
  resolutionHistogram: boolean;
  priorityScatterPlot: boolean;
  stackedAreaChart: boolean;
  issueFunnelChart: boolean;
  backlogWaterfallChart: boolean;
  moduleTreemap: boolean;
  moduleRadarChart: boolean;
  kpiBulletChart: boolean;
}

export const DEFAULT_VISIBILITY: WidgetVisibility = {
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
  atRiskRelease: true,
  agingIssues: true,
  criticalUntouched: true,
  backlogGrowth: true,
  bugFixEfficiency: true,
  repeatBugDetector: true,
  developerLoad: true,
  focusRecommendations: true,
  bugHeatmap: true,
  resolutionHistogram: true,
  priorityScatterPlot: true,
  stackedAreaChart: true,
  issueFunnelChart: true,
  backlogWaterfallChart: true,
  moduleTreemap: true,
  moduleRadarChart: true,
  kpiBulletChart: true,
};

interface WidgetSettingsProps {
  visibility: WidgetVisibility;
  onVisibilityChange: (visibility: WidgetVisibility) => void;
}

export function WidgetSettings({ visibility, onVisibilityChange }: WidgetSettingsProps) {
  const handleToggle = (key: keyof WidgetVisibility, checked?: boolean) => {
    onVisibilityChange({
      ...visibility,
      [key]: checked !== undefined ? checked : !visibility[key],
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
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Core Metrics
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={visibility.smartInsights}
              onCheckedChange={(checked) => handleToggle("smartInsights", checked)}
            >
              Smart Insights
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.summaryMetrics}
              onCheckedChange={(checked) => handleToggle("summaryMetrics", checked)}
            >
              Summary Metrics
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.progressBar}
              onCheckedChange={(checked) => handleToggle("progressBar", checked)}
            >
              Progress Bar
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Analytics Widgets
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={visibility.severityHeatmap}
              onCheckedChange={(checked) => handleToggle("severityHeatmap", checked)}
            >
              Bug Severity Heatmap
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.resolutionTime}
              onCheckedChange={(checked) => handleToggle("resolutionTime", checked)}
            >
              Average Resolution Time
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.trendChart}
              onCheckedChange={(checked) => handleToggle("trendChart", checked)}
            >
              Issue Trend Chart
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.moduleStability}
              onCheckedChange={(checked) => handleToggle("moduleStability", checked)}
            >
              Module Stability Score
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.reopenedIssues}
              onCheckedChange={(checked) => handleToggle("reopenedIssues", checked)}
            >
              Reopened Issues Tracker
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.categoryBreakdown}
              onCheckedChange={(checked) => handleToggle("categoryBreakdown", checked)}
            >
              Bug Category Breakdown
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.bugHotspots}
              onCheckedChange={(checked) => handleToggle("bugHotspots", checked)}
            >
              Bug Hotspots
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Critical Decision Widgets
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={visibility.atRiskRelease}
              onCheckedChange={(checked) => handleToggle("atRiskRelease", checked)}
            >
              🔥 At Risk Release
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.agingIssues}
              onCheckedChange={(checked) => handleToggle("agingIssues", checked)}
            >
              ⏳ Aging Issues
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.criticalUntouched}
              onCheckedChange={(checked) => handleToggle("criticalUntouched", checked)}
            >
              🧨 Critical Bugs Not Touched
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.backlogGrowth}
              onCheckedChange={(checked) => handleToggle("backlogGrowth", checked)}
            >
              📉 Backlog Growth Rate
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.bugFixEfficiency}
              onCheckedChange={(checked) => handleToggle("bugFixEfficiency", checked)}
            >
              🧯 Bug Fix Efficiency
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Engineering Health & AI
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={visibility.repeatBugDetector}
              onCheckedChange={(checked) => handleToggle("repeatBugDetector", checked)}
            >
              🧠 Repeat Bug Detector
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.developerLoad}
              onCheckedChange={(checked) => handleToggle("developerLoad", checked)}
            >
              🧑‍💻 Developer Load
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.focusRecommendations}
              onCheckedChange={(checked) => handleToggle("focusRecommendations", checked)}
            >
              🎯 Focus Recommendations
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Advanced Visualizations
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={visibility.bugHeatmap}
              onCheckedChange={(checked) => handleToggle("bugHeatmap", checked)}
            >
              📊 Bug Heatmap
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.resolutionHistogram}
              onCheckedChange={(checked) => handleToggle("resolutionHistogram", checked)}
            >
              📍 Resolution Histogram
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.priorityScatterPlot}
              onCheckedChange={(checked) => handleToggle("priorityScatterPlot", checked)}
            >
              ⚪ Priority Scatter Plot
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.stackedAreaChart}
              onCheckedChange={(checked) => handleToggle("stackedAreaChart", checked)}
            >
              📉 Stacked Area Chart
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.issueFunnelChart}
              onCheckedChange={(checked) => handleToggle("issueFunnelChart", checked)}
            >
              🎯 Issue Funnel
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.backlogWaterfallChart}
              onCheckedChange={(checked) => handleToggle("backlogWaterfallChart", checked)}
            >
              💧 Backlog Waterfall
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.moduleTreemap}
              onCheckedChange={(checked) => handleToggle("moduleTreemap", checked)}
            >
              🌳 Module Treemap
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.moduleRadarChart}
              onCheckedChange={(checked) => handleToggle("moduleRadarChart", checked)}
            >
              🧭 Module Radar Chart
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.kpiBulletChart}
              onCheckedChange={(checked) => handleToggle("kpiBulletChart", checked)}
            >
              🎯 KPI Bullet Chart
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}