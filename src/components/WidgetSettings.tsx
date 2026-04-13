import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { GripVertical, RotateCcw, Grid3X3 } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface WidgetSize {
  cols: number; // 1, 2, or 3
  rows: number; // 1 or 2
}

export interface WidgetVisibility {
  repositoryFilter: boolean;
  smartInsights: boolean;
  summaryMetrics: boolean;
  progressBar: boolean;
  projectHealthGauge: boolean;
  burndownChart: boolean;
  flowEfficiency: boolean;
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

export type WidgetKey = keyof WidgetVisibility;

export interface WidgetConfig {
  id: WidgetKey;
  enabled: boolean;
  size: WidgetSize;
}

interface WidgetSettingsProps {
  visibility: WidgetVisibility;
  onVisibilityChange: (key: keyof WidgetVisibility, value: boolean) => void;
  widgetOrder: WidgetKey[];
  onWidgetOrderChange: (order: WidgetKey[]) => void;
  widgetSizes: Record<WidgetKey, WidgetSize>;
  onWidgetSizeChange: (key: WidgetKey, size: WidgetSize) => void;
}

const WIDGET_LABELS: Record<WidgetKey, { name: string; icon: string }> = {
  summaryMetrics: { name: "Summary Metrics", icon: "📊" },
  progressBar: { name: "Progress Bar", icon: "📈" },
  projectHealthGauge: { name: "Project Health", icon: "🧭" },
  burndownChart: { name: "Burndown Chart", icon: "📉" },
  flowEfficiency: { name: "Flow Efficiency", icon: "🔄" },
  trendChart: { name: "Issue Trend", icon: "📈" },
  categoryBreakdown: { name: "Bug Category", icon: "🗂️" },
  severityHeatmap: { name: "Severity Heatmap", icon: "🔥" },
  resolutionTime: { name: "Resolution Time", icon: "⏱️" },
  priorityScatterPlot: { name: "Priority Scatter", icon: "⚪" },
  moduleStability: { name: "Module Stability", icon: "🏗️" },
  agingIssues: { name: "Aging Issues", icon: "⏳" },
  atRiskRelease: { name: "At Risk Release", icon: "🚨" },
  backlogGrowth: { name: "Backlog Growth", icon: "📉" },
  bugFixEfficiency: { name: "Bug Fix Efficiency", icon: "🧯" },
  developerLoad: { name: "Developer Load", icon: "👨‍💻" },
  focusRecommendations: { name: "Focus Areas", icon: "🎯" },
  stackedAreaChart: { name: "Stacked Area", icon: "📈" },
  issueFunnelChart: { name: "Issue Funnel", icon: "🔻" },
  backlogWaterfallChart: { name: "Waterfall Chart", icon: "💧" },
  moduleTreemap: { name: "Module Treemap", icon: "🌳" },
  moduleRadarChart: { name: "Module Radar", icon: "🧭" },
  kpiBulletChart: { name: "KPI Bullet", icon: "🎯" },
  bugHeatmap: { name: "Bug Heatmap", icon: "📊" },
  resolutionHistogram: { name: "Resolution Histogram", icon: "📊" },
  reopenedIssues: { name: "Reopened Issues", icon: "🔁" },
  bugHotspots: { name: "Bug Hotspots", icon: "🎯" },
  criticalUntouched: { name: "Critical Untouched", icon: "🧨" },
  repeatBugDetector: { name: "Repeat Bugs", icon: "🔍" },
  smartInsights: { name: "Smart Insights", icon: "💡" },
  repositoryFilter: { name: "Repository Filter", icon: "📁" },
};

const SIZE_OPTIONS = [
  { value: "1x1", label: "1×1", cols: 1, rows: 1 },
  { value: "2x1", label: "2×1", cols: 2, rows: 1 },
  { value: "3x1", label: "3×1", cols: 3, rows: 1 },
  { value: "1x2", label: "1×2", cols: 1, rows: 2 },
  { value: "2x2", label: "2×2", cols: 2, rows: 2 },
];

interface SortableWidgetItemProps {
  id: WidgetKey;
  visibility: WidgetVisibility;
  onVisibilityChange: (key: WidgetKey, value: boolean) => void;
  size: WidgetSize;
  onSizeChange: (key: WidgetKey, size: WidgetSize) => void;
}

function SortableWidgetItem({ id, visibility, onVisibilityChange, size, onSizeChange }: SortableWidgetItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const label = WIDGET_LABELS[id];
  const sizeValue = `${size.cols}x${size.rows}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </button>
      
      <Switch
        checked={visibility[id]}
        onCheckedChange={(checked) => onVisibilityChange(id, checked)}
        className="scale-75"
      />
      
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium truncate block">
          {label?.icon} {label?.name || id}
        </span>
      </div>
      
      <Select
        value={sizeValue}
        onValueChange={(val) => {
          const opt = SIZE_OPTIONS.find(o => o.value === val);
          if (opt) onSizeChange(id, { cols: opt.cols, rows: opt.rows });
        }}
      >
        <SelectTrigger className="w-16 h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SIZE_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function WidgetSettings({
  visibility,
  onVisibilityChange,
  widgetOrder,
  onWidgetOrderChange,
  widgetSizes,
  onWidgetSizeChange,
}: WidgetSettingsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as WidgetKey);
      const newIndex = widgetOrder.indexOf(over.id as WidgetKey);
      onWidgetOrderChange(arrayMove(widgetOrder, oldIndex, newIndex));
    }
  };

  const handleReset = () => {
    const defaultOrder: WidgetKey[] = Object.keys(WIDGET_LABELS) as WidgetKey[];
    onWidgetOrderChange(defaultOrder);
    defaultOrder.forEach(key => {
      onVisibilityChange(key, true);
      onWidgetSizeChange(key, { cols: 1, rows: 1 });
    });
  };

  const enableAll = () => {
    widgetOrder.forEach(key => onVisibilityChange(key, true));
  };

  const disableAll = () => {
    widgetOrder.forEach(key => onVisibilityChange(key, false));
  };

  // Split widgets into 3 columns for display
  const col1 = widgetOrder.slice(0, 11);
  const col2 = widgetOrder.slice(11, 22);
  const col3 = widgetOrder.slice(22);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4" />
          <span className="font-semibold text-sm">Widget Settings</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs">
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={enableAll} className="flex-1 h-7 text-xs">
          Enable All
        </Button>
        <Button variant="outline" size="sm" onClick={disableAll} className="flex-1 h-7 text-xs">
          Disable All
        </Button>
      </div>

      {/* Size Guide */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Size:</span> Width × Height (in grid units)
          <br />
          <span className="text-xs">1×1 = 1 col, 2×1 = 2 cols, 1×2 = tall, 2×2 = large</span>
        </p>
      </div>

      {/* Widget List - 3 columns */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
          {/* Column 1 */}
          <div className="space-y-1">
            <SortableContext items={col1} strategy={verticalListSortingStrategy}>
              {col1.map(key => (
                <SortableWidgetItem
                  key={key}
                  id={key}
                  visibility={visibility}
                  onVisibilityChange={onVisibilityChange}
                  size={widgetSizes[key] || { cols: 1, rows: 1 }}
                  onSizeChange={onWidgetSizeChange}
                />
              ))}
            </SortableContext>
          </div>
          
          {/* Column 2 */}
          <div className="space-y-1">
            <SortableContext items={col2} strategy={verticalListSortingStrategy}>
              {col2.map(key => (
                <SortableWidgetItem
                  key={key}
                  id={key}
                  visibility={visibility}
                  onVisibilityChange={onVisibilityChange}
                  size={widgetSizes[key] || { cols: 1, rows: 1 }}
                  onSizeChange={onWidgetSizeChange}
                />
              ))}
            </SortableContext>
          </div>
          
          {/* Column 3 */}
          <div className="space-y-1">
            <SortableContext items={col3} strategy={verticalListSortingStrategy}>
              {col3.map(key => (
                <SortableWidgetItem
                  key={key}
                  id={key}
                  visibility={visibility}
                  onVisibilityChange={onVisibilityChange}
                  size={widgetSizes[key] || { cols: 1, rows: 1 }}
                  onSizeChange={onWidgetSizeChange}
                />
              ))}
            </SortableContext>
          </div>
        </div>
      </DndContext>

      {/* Stats */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        {Object.values(visibility).filter(Boolean).length} of {Object.keys(visibility).length} widgets enabled
      </div>
    </div>
  );
}

export const DEFAULT_WIDGET_ORDER: WidgetKey[] = [
  // Row 1: Summary
  "summaryMetrics",
  "progressBar",
  // Row 2: Main analytics
  "projectHealthGauge",
  "burndownChart",
  "flowEfficiency",
  // Row 3: Trends
  "trendChart",
  "categoryBreakdown",
  "severityHeatmap",
  // Row 4: Resolution
  "resolutionTime",
  "priorityScatterPlot",
  "moduleStability",
  // Row 5: Issues
  "agingIssues",
  "atRiskRelease",
  "backlogGrowth",
  // Row 6: Efficiency
  "bugFixEfficiency",
  "developerLoad",
  "focusRecommendations",
  // Row 7: Charts
  "stackedAreaChart",
  "issueFunnelChart",
  "backlogWaterfallChart",
  // Row 8: Module analysis
  "moduleTreemap",
  "moduleRadarChart",
  "kpiBulletChart",
  // Row 9: Heatmaps
  "bugHeatmap",
  "resolutionHistogram",
  "reopenedIssues",
  // Row 10: Detection
  "bugHotspots",
  "criticalUntouched",
  "repeatBugDetector",
  // Full width
  "smartInsights",
  "repositoryFilter",
];

export const DEFAULT_WIDGET_SIZES: Record<WidgetKey, WidgetSize> = {
  summaryMetrics: { cols: 2, rows: 1 },
  progressBar: { cols: 1, rows: 1 },
  projectHealthGauge: { cols: 1, rows: 1 },
  burndownChart: { cols: 1, rows: 1 },
  flowEfficiency: { cols: 1, rows: 1 },
  trendChart: { cols: 1, rows: 1 },
  categoryBreakdown: { cols: 1, rows: 1 },
  severityHeatmap: { cols: 1, rows: 1 },
  resolutionTime: { cols: 1, rows: 1 },
  priorityScatterPlot: { cols: 1, rows: 1 },
  moduleStability: { cols: 1, rows: 1 },
  agingIssues: { cols: 1, rows: 1 },
  atRiskRelease: { cols: 1, rows: 1 },
  backlogGrowth: { cols: 1, rows: 1 },
  bugFixEfficiency: { cols: 1, rows: 1 },
  developerLoad: { cols: 1, rows: 1 },
  focusRecommendations: { cols: 1, rows: 1 },
  stackedAreaChart: { cols: 1, rows: 1 },
  issueFunnelChart: { cols: 1, rows: 1 },
  backlogWaterfallChart: { cols: 1, rows: 1 },
  moduleTreemap: { cols: 1, rows: 1 },
  moduleRadarChart: { cols: 1, rows: 1 },
  kpiBulletChart: { cols: 1, rows: 1 },
  bugHeatmap: { cols: 1, rows: 1 },
  resolutionHistogram: { cols: 1, rows: 1 },
  reopenedIssues: { cols: 1, rows: 1 },
  bugHotspots: { cols: 1, rows: 1 },
  criticalUntouched: { cols: 1, rows: 1 },
  repeatBugDetector: { cols: 1, rows: 1 },
  smartInsights: { cols: 3, rows: 1 },
  repositoryFilter: { cols: 3, rows: 1 },
};

export const DEFAULT_VISIBILITY: WidgetVisibility = {
  repositoryFilter: true,
  smartInsights: true,
  summaryMetrics: true,
  progressBar: true,
  projectHealthGauge: true,
  burndownChart: true,
  flowEfficiency: true,
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