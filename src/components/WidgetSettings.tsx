import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, LayoutGrid, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

export const DEFAULT_WIDGET_ORDER: (keyof WidgetVisibility)[] = [
  "repositoryFilter",
  "smartInsights",
  "summaryMetrics",
  "progressBar",
  "projectHealthGauge",
  "burndownChart",
  "flowEfficiency",
  "severityHeatmap",
  "resolutionTime",
  "trendChart",
  "moduleStability",
  "reopenedIssues",
  "categoryBreakdown",
  "bugHotspots",
  "atRiskRelease",
  "agingIssues",
  "criticalUntouched",
  "backlogGrowth",
  "bugFixEfficiency",
  "repeatBugDetector",
  "developerLoad",
  "focusRecommendations",
  "bugHeatmap",
  "resolutionHistogram",
  "priorityScatterPlot",
  "stackedAreaChart",
  "issueFunnelChart",
  "backlogWaterfallChart",
  "moduleTreemap",
  "moduleRadarChart",
  "kpiBulletChart",
];

const WIDGET_LABELS: Record<keyof WidgetVisibility, string> = {
  repositoryFilter: "📁 Repository Filter",
  smartInsights: "Smart Insights",
  summaryMetrics: "Summary Metrics",
  progressBar: "Progress Bar",
  projectHealthGauge: "🧭 Project Health Gauge",
  burndownChart: "📉 Burndown Chart",
  flowEfficiency: "🔄 Flow Efficiency",
  severityHeatmap: "Bug Severity Heatmap",
  resolutionTime: "Avg Resolution Time",
  trendChart: "Issue Trend Chart",
  moduleStability: "Module Stability",
  reopenedIssues: "Reopened Issues",
  categoryBreakdown: "Category Breakdown",
  bugHotspots: "Bug Hotspots",
  atRiskRelease: "🔥 At Risk Release",
  agingIssues: "⏳ Aging Issues",
  criticalUntouched: "🧨 Critical Untouched",
  backlogGrowth: "📉 Backlog Growth",
  bugFixEfficiency: "🧯 Bug Fix Efficiency",
  repeatBugDetector: "🧠 Repeat Bug Detector",
  developerLoad: "🧑‍💻 Developer Load",
  focusRecommendations: "🎯 Focus Recommendations",
  bugHeatmap: "📊 Bug Heatmap",
  resolutionHistogram: "📍 Resolution Histogram",
  priorityScatterPlot: "⚪ Priority Scatter",
  stackedAreaChart: "📉 Stacked Area",
  issueFunnelChart: "🎯 Issue Funnel",
  backlogWaterfallChart: "💧 Backlog Waterfall",
  moduleTreemap: "🌳 Module Treemap",
  moduleRadarChart: "🧭 Module Radar",
  kpiBulletChart: "🎯 KPI Bullet Chart",
};

interface WidgetSettingsProps {
  visibility: WidgetVisibility;
  onVisibilityChange: (visibility: WidgetVisibility) => void;
  widgetsPerRow: number;
  onWidgetsPerRowChange: (count: number) => void;
  widgetOrder: (keyof WidgetVisibility)[];
  onWidgetOrderChange: (order: (keyof WidgetVisibility)[]) => void;
}

export function WidgetSettings({ 
  visibility, 
  onVisibilityChange,
  widgetsPerRow,
  onWidgetsPerRowChange,
  widgetOrder,
  onWidgetOrderChange,
}: WidgetSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggle = (key: keyof WidgetVisibility, checked?: boolean) => {
    onVisibilityChange({
      ...visibility,
      [key]: checked !== undefined ? checked : !visibility[key],
    });
  };

  const handleResetDefaults = () => {
    onVisibilityChange(DEFAULT_VISIBILITY);
    onWidgetsPerRowChange(2);
    onWidgetOrderChange(DEFAULT_WIDGET_ORDER);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as keyof WidgetVisibility);
      const newIndex = widgetOrder.indexOf(over.id as keyof WidgetVisibility);
      onWidgetOrderChange(arrayMove(widgetOrder, oldIndex, newIndex));
    }
  };

  const visibleCount = Object.values(visibility).filter(Boolean).length;
  const totalCount = Object.keys(visibility).length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 px-2 font-normal">
          <Settings2 className="h-4 w-4" />
          Widgets
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
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
        
        <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
          <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Widgets ({visibleCount}/{totalCount})</span>
            <span className="text-[10px] opacity-70">Drag to reorder</span>
          </DropdownMenuLabel>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgetOrder}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0.5 px-1">
                {widgetOrder.map((key) => (
                  <SortableWidgetItem
                    key={key}
                    id={key}
                    label={WIDGET_LABELS[key]}
                    checked={visibility[key]}
                    onCheckedChange={(checked) => handleToggle(key, checked)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Sortable widget item component
function SortableWidgetItem({ 
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-sm
        ${isDragging ? "bg-muted/80 shadow-sm" : "hover:bg-muted/50"}
      `}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-4 w-4"
      />
      <label
        htmlFor={id}
        className="text-sm flex-1 cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
}