import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
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
            <WidgetCheckbox
              id="smartInsights"
              label="Smart Insights"
              checked={visibility.smartInsights}
              onCheckedChange={(checked) => handleToggle("smartInsights", checked)}
            />
            <WidgetCheckbox
              id="summaryMetrics"
              label="Summary Metrics"
              checked={visibility.summaryMetrics}
              onCheckedChange={(checked) => handleToggle("summaryMetrics", checked)}
            />
            <WidgetCheckbox
              id="progressBar"
              label="Progress Bar"
              checked={visibility.progressBar}
              onCheckedChange={(checked) => handleToggle("progressBar", checked)}
            />
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground/70">Analytics</div>
            <WidgetCheckbox
              id="severityHeatmap"
              label="Bug Severity Heatmap"
              checked={visibility.severityHeatmap}
              onCheckedChange={(checked) => handleToggle("severityHeatmap", checked)}
            />
            <WidgetCheckbox
              id="resolutionTime"
              label="Avg Resolution Time"
              checked={visibility.resolutionTime}
              onCheckedChange={(checked) => handleToggle("resolutionTime", checked)}
            />
            <WidgetCheckbox
              id="trendChart"
              label="Issue Trend Chart"
              checked={visibility.trendChart}
              onCheckedChange={(checked) => handleToggle("trendChart", checked)}
            />
            <WidgetCheckbox
              id="moduleStability"
              label="Module Stability"
              checked={visibility.moduleStability}
              onCheckedChange={(checked) => handleToggle("moduleStability", checked)}
            />
            <WidgetCheckbox
              id="reopenedIssues"
              label="Reopened Issues"
              checked={visibility.reopenedIssues}
              onCheckedChange={(checked) => handleToggle("reopenedIssues", checked)}
            />
            <WidgetCheckbox
              id="categoryBreakdown"
              label="Category Breakdown"
              checked={visibility.categoryBreakdown}
              onCheckedChange={(checked) => handleToggle("categoryBreakdown", checked)}
            />
            <WidgetCheckbox
              id="bugHotspots"
              label="Bug Hotspots"
              checked={visibility.bugHotspots}
              onCheckedChange={(checked) => handleToggle("bugHotspots", checked)}
            />
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground/70">Critical</div>
            <WidgetCheckbox
              id="atRiskRelease"
              label="🔥 At Risk Release"
              checked={visibility.atRiskRelease}
              onCheckedChange={(checked) => handleToggle("atRiskRelease", checked)}
            />
            <WidgetCheckbox
              id="agingIssues"
              label="⏳ Aging Issues"
              checked={visibility.agingIssues}
              onCheckedChange={(checked) => handleToggle("agingIssues", checked)}
            />
            <WidgetCheckbox
              id="criticalUntouched"
              label="🧨 Critical Untouched"
              checked={visibility.criticalUntouched}
              onCheckedChange={(checked) => handleToggle("criticalUntouched", checked)}
            />
            <WidgetCheckbox
              id="backlogGrowth"
              label="📉 Backlog Growth"
              checked={visibility.backlogGrowth}
              onCheckedChange={(checked) => handleToggle("backlogGrowth", checked)}
            />
            <WidgetCheckbox
              id="bugFixEfficiency"
              label="🧯 Bug Fix Efficiency"
              checked={visibility.bugFixEfficiency}
              onCheckedChange={(checked) => handleToggle("bugFixEfficiency", checked)}
            />
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground/70">Health & AI</div>
            <WidgetCheckbox
              id="repeatBugDetector"
              label="🧠 Repeat Bug Detector"
              checked={visibility.repeatBugDetector}
              onCheckedChange={(checked) => handleToggle("repeatBugDetector", checked)}
            />
            <WidgetCheckbox
              id="developerLoad"
              label="🧑‍💻 Developer Load"
              checked={visibility.developerLoad}
              onCheckedChange={(checked) => handleToggle("developerLoad", checked)}
            />
            <WidgetCheckbox
              id="focusRecommendations"
              label="🎯 Focus Recommendations"
              checked={visibility.focusRecommendations}
              onCheckedChange={(checked) => handleToggle("focusRecommendations", checked)}
            />
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground/70">Visualizations</div>
            <WidgetCheckbox
              id="bugHeatmap"
              label="📊 Bug Heatmap"
              checked={visibility.bugHeatmap}
              onCheckedChange={(checked) => handleToggle("bugHeatmap", checked)}
            />
            <WidgetCheckbox
              id="resolutionHistogram"
              label="📍 Resolution Histogram"
              checked={visibility.resolutionHistogram}
              onCheckedChange={(checked) => handleToggle("resolutionHistogram", checked)}
            />
            <WidgetCheckbox
              id="priorityScatterPlot"
              label="⚪ Priority Scatter"
              checked={visibility.priorityScatterPlot}
              onCheckedChange={(checked) => handleToggle("priorityScatterPlot", checked)}
            />
            <WidgetCheckbox
              id="stackedAreaChart"
              label="📉 Stacked Area"
              checked={visibility.stackedAreaChart}
              onCheckedChange={(checked) => handleToggle("stackedAreaChart", checked)}
            />
            <WidgetCheckbox
              id="issueFunnelChart"
              label="🎯 Issue Funnel"
              checked={visibility.issueFunnelChart}
              onCheckedChange={(checked) => handleToggle("issueFunnelChart", checked)}
            />
            <WidgetCheckbox
              id="backlogWaterfallChart"
              label="💧 Backlog Waterfall"
              checked={visibility.backlogWaterfallChart}
              onCheckedChange={(checked) => handleToggle("backlogWaterfallChart", checked)}
            />
            <WidgetCheckbox
              id="moduleTreemap"
              label="🌳 Module Treemap"
              checked={visibility.moduleTreemap}
              onCheckedChange={(checked) => handleToggle("moduleTreemap", checked)}
            />
            <WidgetCheckbox
              id="moduleRadarChart"
              label="🧭 Module Radar"
              checked={visibility.moduleRadarChart}
              onCheckedChange={(checked) => handleToggle("moduleRadarChart", checked)}
            />
            <WidgetCheckbox
              id="kpiBulletChart"
              label="🎯 KPI Bullet Chart"
              checked={visibility.kpiBulletChart}
              onCheckedChange={(checked) => handleToggle("kpiBulletChart", checked)}
            />
          </DropdownMenuGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Custom checkbox item component
function WidgetCheckbox({ 
  id, 
  label, 
  checked, 
  onCheckedChange 
}: { 
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-sm cursor-pointer"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-4 w-4"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}