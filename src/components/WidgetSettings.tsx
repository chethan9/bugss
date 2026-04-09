import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Settings2, LayoutGrid } from "lucide-react";

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
  widgetsPerRow: number;
  onWidgetsPerRowChange: (count: number) => void;
}

export function WidgetSettings({ 
  visibility, 
  onVisibilityChange,
  widgetsPerRow,
  onWidgetsPerRowChange,
}: WidgetSettingsProps) {
  const handleToggle = (key: keyof WidgetVisibility, checked?: boolean) => {
    onVisibilityChange({
      ...visibility,
      [key]: checked !== undefined ? checked : !visibility[key],
    });
  };

  const handleResetDefaults = () => {
    onVisibilityChange(DEFAULT_VISIBILITY);
    onWidgetsPerRowChange(2);
  };

  const visibleCount = Object.values(visibility).filter(Boolean).length;
  const totalCount = Object.keys(visibility).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Widgets
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Widget Settings</span>
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
        
        {/* Widgets Per Row Setting */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
            <LayoutGrid className="h-3 w-3" />
            Widgets Per Row
          </DropdownMenuLabel>
          <div className="flex gap-1 px-2 py-1">
            {[1, 2, 3, 4].map((num) => (
              <Button
                key={num}
                variant={widgetsPerRow === num ? "default" : "outline"}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => onWidgetsPerRowChange(num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup className="max-h-[350px] overflow-y-auto">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Visible Widgets ({visibleCount}/{totalCount})
          </DropdownMenuLabel>
          
          <DropdownMenuGroup>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground/70">Core</div>
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
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground/70">Analytics</div>
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
              Avg Resolution Time
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
              Module Stability
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.reopenedIssues}
              onCheckedChange={(checked) => handleToggle("reopenedIssues", checked)}
            >
              Reopened Issues
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.categoryBreakdown}
              onCheckedChange={(checked) => handleToggle("categoryBreakdown", checked)}
            >
              Category Breakdown
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
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground/70">Critical</div>
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
              🧨 Critical Untouched
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.backlogGrowth}
              onCheckedChange={(checked) => handleToggle("backlogGrowth", checked)}
            >
              📉 Backlog Growth
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
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground/70">Health & AI</div>
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
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground/70">Visualizations</div>
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
              ⚪ Priority Scatter
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibility.stackedAreaChart}
              onCheckedChange={(checked) => handleToggle("stackedAreaChart", checked)}
            >
              📉 Stacked Area
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
              🧭 Module Radar
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