import type { WidgetVisibility } from "@/components/WidgetSettings";
import type { GitHubIssue } from "@/components/IssueTable";
import {
  generateSmartInsights,
  calculateSeverityDistribution,
  calculateAverageResolutionTime,
  calculateIssueTrend,
  calculateModuleStability,
  calculateReopenedIssues,
  calculateCategoryBreakdown,
  calculateBugHotspots,
  calculateAtRiskRelease,
  calculateAgingIssues,
  calculateCriticalUntouched,
  calculateBacklogGrowth,
  calculateBugFixEfficiency,
  detectRepeatBugs,
  calculateDeveloperLoad,
  generateFocusRecommendations,
  calculateBugHeatmap,
  calculateResolutionHistogram,
  calculatePriorityResolutionScatter,
  calculateStackedAreaData,
  calculateIssueFunnel,
  calculateBacklogWaterfall,
  calculateModuleTreemap,
  calculateModuleRadarData,
  calculateKPIMetrics,
} from "@/services/analyticsService";

export const INITIAL_WIDGET_ROWS = 2;
export const WIDGET_ROWS_INCREMENT = 2;

/** Analytics bundle keys each widget may need (widgets using only `filteredIssues` are omitted). */
const WIDGET_ANALYTICS_KEYS: Partial<Record<keyof WidgetVisibility, readonly string[]>> = {
  smartInsights: ["insights"],
  severityHeatmap: ["severities"],
  resolutionTime: ["resolutionTime"],
  trendChart: ["trend"],
  moduleStability: ["stability"],
  reopenedIssues: ["reopened"],
  categoryBreakdown: ["categories"],
  bugHotspots: ["hotspots"],
  atRiskRelease: ["atRiskRelease"],
  agingIssues: ["agingIssues"],
  criticalUntouched: ["criticalUntouched"],
  backlogGrowth: ["backlogGrowth"],
  bugFixEfficiency: ["bugFixEfficiency"],
  repeatBugDetector: ["repeatBugs"],
  developerLoad: ["developerLoad"],
  focusRecommendations: ["focusRecommendations"],
  bugHeatmap: ["bugHeatmap"],
  resolutionHistogram: ["resolutionHistogram"],
  priorityScatterPlot: ["priorityScatter"],
  stackedAreaChart: ["stackedAreaData"],
  issueFunnelChart: ["issueFunnel"],
  backlogWaterfallChart: ["backlogWaterfall"],
  moduleTreemap: ["moduleTreemap"],
  moduleRadarChart: ["moduleRadar"],
  kpiBulletChart: ["kpiMetrics"],
};

export type DashboardAnalytics = ReturnType<typeof createEmptyDashboardAnalytics>;

export function createEmptyDashboardAnalytics() {
  return {
    insights: generateSmartInsights([]),
    severities: calculateSeverityDistribution([]),
    resolutionTime: calculateAverageResolutionTime([]),
    trend: calculateIssueTrend([], 30),
    stability: calculateModuleStability([]),
    reopened: calculateReopenedIssues([]),
    categories: calculateCategoryBreakdown([]),
    hotspots: calculateBugHotspots([], 5),
    atRiskRelease: calculateAtRiskRelease([]),
    agingIssues: calculateAgingIssues([]),
    criticalUntouched: calculateCriticalUntouched([], 3),
    backlogGrowth: calculateBacklogGrowth([]),
    bugFixEfficiency: calculateBugFixEfficiency([], 30),
    repeatBugs: detectRepeatBugs([], 7),
    developerLoad: calculateDeveloperLoad([]),
    focusRecommendations: generateFocusRecommendations([]),
    bugHeatmap: calculateBugHeatmap([], 30),
    resolutionHistogram: calculateResolutionHistogram([]),
    priorityScatter: calculatePriorityResolutionScatter([]),
    stackedAreaData: calculateStackedAreaData([], 30),
    issueFunnel: calculateIssueFunnel([]),
    backlogWaterfall: calculateBacklogWaterfall([], 4),
    moduleTreemap: calculateModuleTreemap([]),
    moduleRadar: calculateModuleRadarData([], 5),
    kpiMetrics: calculateKPIMetrics([]),
  };
}

export function getAnalyticsKeysForWidgets(widgets: (keyof WidgetVisibility)[]): Set<string> {
  const keys = new Set<string>();
  for (const widget of widgets) {
    WIDGET_ANALYTICS_KEYS[widget]?.forEach((k) => keys.add(k));
  }
  return keys;
}

/** Compute only analytics required by the widgets currently on screen. */
export function computeDashboardAnalytics(
  issues: GitHubIssue[],
  widgets: (keyof WidgetVisibility)[]
): DashboardAnalytics {
  const needed = getAnalyticsKeysForWidgets(widgets);
  const result = createEmptyDashboardAnalytics();

  if (needed.has("insights")) result.insights = generateSmartInsights(issues);
  if (needed.has("severities")) result.severities = calculateSeverityDistribution(issues);
  if (needed.has("resolutionTime")) result.resolutionTime = calculateAverageResolutionTime(issues);
  if (needed.has("trend")) result.trend = calculateIssueTrend(issues, 30);
  if (needed.has("stability")) result.stability = calculateModuleStability(issues);
  if (needed.has("reopened")) result.reopened = calculateReopenedIssues(issues);
  if (needed.has("categories")) result.categories = calculateCategoryBreakdown(issues);
  if (needed.has("hotspots")) result.hotspots = calculateBugHotspots(issues, 5);
  if (needed.has("atRiskRelease")) result.atRiskRelease = calculateAtRiskRelease(issues);
  if (needed.has("agingIssues")) result.agingIssues = calculateAgingIssues(issues);
  if (needed.has("criticalUntouched")) result.criticalUntouched = calculateCriticalUntouched(issues, 3);
  if (needed.has("backlogGrowth")) result.backlogGrowth = calculateBacklogGrowth(issues);
  if (needed.has("bugFixEfficiency")) result.bugFixEfficiency = calculateBugFixEfficiency(issues, 30);
  if (needed.has("repeatBugs")) result.repeatBugs = detectRepeatBugs(issues, 7);
  if (needed.has("developerLoad")) result.developerLoad = calculateDeveloperLoad(issues);
  if (needed.has("focusRecommendations")) {
    result.focusRecommendations = generateFocusRecommendations(issues);
  }
  if (needed.has("bugHeatmap")) result.bugHeatmap = calculateBugHeatmap(issues, 30);
  if (needed.has("resolutionHistogram")) {
    result.resolutionHistogram = calculateResolutionHistogram(issues);
  }
  if (needed.has("priorityScatter")) {
    result.priorityScatter = calculatePriorityResolutionScatter(issues);
  }
  if (needed.has("stackedAreaData")) result.stackedAreaData = calculateStackedAreaData(issues, 30);
  if (needed.has("issueFunnel")) result.issueFunnel = calculateIssueFunnel(issues);
  if (needed.has("backlogWaterfall")) result.backlogWaterfall = calculateBacklogWaterfall(issues, 4);
  if (needed.has("moduleTreemap")) result.moduleTreemap = calculateModuleTreemap(issues);
  if (needed.has("moduleRadar")) result.moduleRadar = calculateModuleRadarData(issues, 5);
  if (needed.has("kpiMetrics")) result.kpiMetrics = calculateKPIMetrics(issues);

  return result;
}
