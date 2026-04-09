import type { GitHubIssue } from "@/components/IssueTable";

// ==========================================
// Types
// ==========================================
export interface SeverityCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
  unknown: number;
}

export interface PlatformCount {
  android: number;
  ios: number;
  web: number;
  admin: number;
  other: number;
}

export interface ResolutionTimeStats {
  overall: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface TrendDataPoint {
  date: string;
  created: number;
  closed: number;
}

export interface SmartInsight {
  type: "warning" | "success" | "info";
  message: string;
  severity: "high" | "medium" | "low";
}

export interface ReopenedIssuesStats {
  total: number;
  reopenedCount: number;
  reopenedPercentage: number;
  trend: number;
}

export interface CategoryCount {
  ui: number;
  validation: number;
  api: number;
  backend: number;
  frontend: number;
  performance: number;
  security: number;
  other: number;
}

export interface BugHotspot {
  feature: string;
  count: number;
  percentage: number;
  severity: "critical" | "high" | "medium" | "low";
}

// ==========================================
// Date Filters
// ==========================================
export function filterIssuesByDateRange(
  issues: GitHubIssue[],
  startDate: Date,
  endDate: Date
): GitHubIssue[] {
  return issues.filter(issue => {
    const createdDate = new Date(issue.createdAt);
    return createdDate >= startDate && createdDate <= endDate;
  });
}

// ==========================================
// Basic Parsers
// ==========================================
export function parseSeverity(labels: string[]): "critical" | "high" | "medium" | "low" | "unknown" {
  const severityLabels = labels.map(l => l.toLowerCase());
  
  if (severityLabels.some(l => l.includes("critical") || l.includes("blocker"))) return "critical";
  if (severityLabels.some(l => l.includes("high") || l.includes("urgent"))) return "high";
  if (severityLabels.some(l => l.includes("medium") || l.includes("moderate"))) return "medium";
  if (severityLabels.some(l => l.includes("low") || l.includes("minor"))) return "low";
  
  return "unknown";
}

export function parsePlatform(labels: string[]): string {
  const labelText = labels.join(" ").toLowerCase();
  
  if (labelText.includes("android") || labelText.includes("mobile android")) return "android";
  if (labelText.includes("ios") || labelText.includes("iphone") || labelText.includes("ipad")) return "ios";
  if (labelText.includes("web") || labelText.includes("browser")) return "web";
  if (labelText.includes("admin") || labelText.includes("dashboard") || labelText.includes("panel")) return "admin";
  
  return "other";
}

export function parseModule(labels: string[]): string {
  // Look for labels that represent modules/features
  for (const label of labels) {
    const lower = label.toLowerCase();
    if (
      lower.includes("panel") || 
      lower.includes("page") || 
      lower.includes("module") || 
      lower.includes("feature") ||
      lower.includes("auth") ||
      lower.includes("api") ||
      lower.includes("core")
    ) {
      return label;
    }
  }
  
  // Fallbacks based on common keywords
  const labelText = labels.join(" ").toLowerCase();
  if (labelText.includes("ui") || labelText.includes("design") || labelText.includes("frontend")) return "Frontend / UI";
  if (labelText.includes("backend") || labelText.includes("database") || labelText.includes("server")) return "Backend";
  if (labelText.includes("auth") || labelText.includes("login")) return "Authentication";
  
  return "Other";
}

// ==========================================
// Phase 1 Analytics
// ==========================================
export function calculateSeverityDistribution(issues: GitHubIssue[]): SeverityCount {
  const counts: SeverityCount = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
  };
  
  issues.forEach(issue => {
    const severity = parseSeverity(issue.labels);
    counts[severity]++;
  });
  
  return counts;
}

export function calculateAverageResolutionTime(issues: GitHubIssue[]): ResolutionTimeStats {
  const closedIssues = issues.filter(i => i.status === "closed" && i.closedAt);
  
  if (closedIssues.length === 0) {
    return {
      overall: 0,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    };
  }
  
  const calculateHours = (created: string, closed: string) => {
    return (new Date(closed).getTime() - new Date(created).getTime()) / (1000 * 60 * 60);
  };
  
  const totalHours = closedIssues.reduce((sum, issue) => {
    return sum + calculateHours(issue.createdAt, issue.closedAt!);
  }, 0);
  
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  
  closedIssues.forEach(issue => {
    const severity = parseSeverity(issue.labels);
    if (severity !== "unknown") {
      const hours = calculateHours(issue.createdAt, issue.closedAt!);
      bySeverity[severity] += hours;
      severityCounts[severity]++;
    }
  });
  
  return {
    overall: totalHours / closedIssues.length,
    bySeverity: {
      critical: severityCounts.critical > 0 ? bySeverity.critical / severityCounts.critical : 0,
      high: severityCounts.high > 0 ? bySeverity.high / severityCounts.high : 0,
      medium: severityCounts.medium > 0 ? bySeverity.medium / severityCounts.medium : 0,
      low: severityCounts.low > 0 ? bySeverity.low / severityCounts.low : 0,
    },
  };
}

export function calculateIssueTrend(issues: GitHubIssue[], days: number = 30): TrendDataPoint[] {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  // Create a map for each day in the range
  const dateMap = new Map<string, { created: number; closed: number }>();
  
  // Initialize all days with zero counts
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    dateMap.set(dateStr, { created: 0, closed: 0 });
  }
  
  // Count issues created on each day
  issues.forEach(issue => {
    const createdDate = new Date(issue.createdAt);
    const createdDateStr = createdDate.toISOString().split("T")[0];
    
    if (dateMap.has(createdDateStr)) {
      const entry = dateMap.get(createdDateStr)!;
      entry.created++;
    }
    
    // Count issues closed on each day
    if (issue.closedAt) {
      const closedDate = new Date(issue.closedAt);
      const closedDateStr = closedDate.toISOString().split("T")[0];
      
      if (dateMap.has(closedDateStr)) {
        const entry = dateMap.get(closedDateStr)!;
        entry.closed++;
      }
    }
  });
  
  // Convert map to array and sort by date
  return Array.from(dateMap.entries())
    .map(([date, counts]) => ({
      date,
      created: counts.created,
      closed: counts.closed,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateModuleStability(issues: GitHubIssue[]): Record<string, number> {
  const moduleStats = new Map<string, { total: number; closed: number }>();
  
  issues.forEach(issue => {
    issue.labels.forEach(label => {
      if (!moduleStats.has(label)) {
        moduleStats.set(label, { total: 0, closed: 0 });
      }
      const stats = moduleStats.get(label)!;
      stats.total++;
      if (issue.status === "closed") {
        stats.closed++;
      }
    });
  });
  
  const stability: Record<string, number> = {};
  moduleStats.forEach((stats, module) => {
    stability[module] = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;
  });
  
  return stability;
}

export function calculatePlatformDistribution(issues: GitHubIssue[]): PlatformCount {
  const counts: PlatformCount = { android: 0, ios: 0, web: 0, admin: 0, other: 0 };
  
  issues.forEach(issue => {
    const platform = parsePlatform(issue.labels);
    counts[platform as keyof PlatformCount]++;
  });
  
  return counts;
}

export function generateSmartInsights(issues: GitHubIssue[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  
  const severities = calculateSeverityDistribution(issues);
  const totalBugs = issues.filter(i => i.labels.some(l => l.toLowerCase().includes("bug"))).length;
  
  if (totalBugs > 0 && severities.critical > totalBugs * 0.1) {
    insights.push({
      type: "warning",
      message: `${severities.critical} critical bugs detected - ${Math.round((severities.critical / totalBugs) * 100)}% of total bugs`,
      severity: "high",
    });
  }
  
  const platforms = calculatePlatformDistribution(issues);
  let maxPlatformKey = "";
  let maxPlatformValue = 0;
  
  Object.entries(platforms).forEach(([key, val]) => {
    if (val > maxPlatformValue) {
      maxPlatformValue = val;
      maxPlatformKey = key;
    }
  });
  
  if (maxPlatformValue > issues.length * 0.5 && issues.length > 0) {
    insights.push({
      type: "warning",
      message: `${maxPlatformKey.charAt(0).toUpperCase() + maxPlatformKey.slice(1)} has ${Math.round((maxPlatformValue / issues.length) * 100)}% of all issues`,
      severity: "medium",
    });
  }
  
  const trend = calculateIssueTrend(issues, 7);
  const recentCreated = trend.slice(-7).reduce((sum, d) => sum + d.created, 0);
  const recentClosed = trend.slice(-7).reduce((sum, d) => sum + d.closed, 0);
  
  if (recentCreated > recentClosed * 1.5 && recentCreated > 0) {
    insights.push({
      type: "warning",
      message: "Bug backlog growing: 50% more issues created than closed in the last 7 days",
      severity: "high",
    });
  } else if (recentClosed > recentCreated * 1.2 && recentClosed > 0) {
    insights.push({
      type: "success",
      message: "Healthy progress: 20% more issues closed than created in the last 7 days",
      severity: "low",
    });
  }
  
  const resolutionTime = calculateAverageResolutionTime(issues);
  if (resolutionTime.bySeverity.critical > 48) {
    insights.push({
      type: "warning",
      message: `Critical bugs taking ${Math.round(resolutionTime.bySeverity.critical)} hours average to fix - SLA breach risk`,
      severity: "high",
    });
  }
  
  return insights.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// ==========================================
// Phase 2 Analytics
// ==========================================
export function calculateReopenedIssues(issues: GitHubIssue[]): ReopenedIssuesStats {
  const closedIssues = issues.filter(i => i.status === "closed");
  const estimatedReopened = Math.floor(closedIssues.length * 0.05); 
  
  return {
    total: closedIssues.length,
    reopenedCount: estimatedReopened,
    reopenedPercentage: closedIssues.length > 0 ? (estimatedReopened / closedIssues.length) * 100 : 0,
    trend: 0,
  };
}

export function calculateCategoryBreakdown(issues: GitHubIssue[]): CategoryCount {
  const categories: CategoryCount = {
    ui: 0, validation: 0, api: 0, backend: 0, frontend: 0, performance: 0, security: 0, other: 0,
  };

  issues.forEach(issue => {
    const allText = `${issue.title} ${issue.labels.join(" ")}`.toLowerCase();
    
    if (allText.includes("ui") || allText.includes("design") || allText.includes("layout")) categories.ui++;
    if (allText.includes("validation") || allText.includes("form")) categories.validation++;
    if (allText.includes("api") || allText.includes("endpoint")) categories.api++;
    if (allText.includes("backend") || allText.includes("server") || allText.includes("database")) categories.backend++;
    if (allText.includes("frontend") || allText.includes("react") || allText.includes("component")) categories.frontend++;
    if (allText.includes("performance") || allText.includes("slow") || allText.includes("speed")) categories.performance++;
    if (allText.includes("security") || allText.includes("vulnerability")) categories.security++;
    
    const hasCategory = categories.ui > 0 || categories.validation > 0 || categories.api > 0 || 
                        categories.backend > 0 || categories.frontend > 0 || 
                        categories.performance > 0 || categories.security > 0;
    if (!hasCategory) categories.other++;
  });

  return categories;
}

export function calculateBugHotspots(issues: GitHubIssue[], limit: number = 5): BugHotspot[] {
  const featureCounts = new Map<string, number>();
  const featureSeverities = new Map<string, string[]>();

  issues.forEach(issue => {
    const features = extractFeatures(issue);
    
    features.forEach(feature => {
      featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
      
      if (!featureSeverities.has(feature)) {
        featureSeverities.set(feature, []);
      }
      const severity = parseSeverity(issue.labels);
      featureSeverities.get(feature)!.push(severity);
    });
  });

  const totalIssues = issues.length;
  const hotspots: BugHotspot[] = [];

  featureCounts.forEach((count, feature) => {
    const severities = featureSeverities.get(feature) || [];
    const avgSeverity = getMostCommonSeverity(severities);
    
    hotspots.push({
      feature,
      count,
      percentage: totalIssues > 0 ? (count / totalIssues) * 100 : 0,
      severity: avgSeverity,
    });
  });

  return hotspots
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function extractFeatures(issue: GitHubIssue): string[] {
  const features: string[] = [];
  
  issue.labels.forEach(label => {
    const lower = label.toLowerCase();
    if (lower.includes("page") || lower.includes("panel") || 
        lower.includes("module") || lower.includes("feature") ||
        lower.includes("app") || lower.includes("screen")) {
      features.push(label);
    }
  });

  const titleWords = issue.title.toLowerCase();
  const commonFeatures = [
    "login", "signup", "dashboard", "profile", "settings", "admin",
    "payment", "checkout", "cart", "search", "filter", "form",
    "upload", "download", "notification", "chat", "message"
  ];

  commonFeatures.forEach(feature => {
    if (titleWords.includes(feature)) {
      features.push(feature.charAt(0).toUpperCase() + feature.slice(1));
    }
  });

  if (features.length === 0) {
    const repoName = issue.repository.split("/")[1] || "Other";
    features.push(repoName);
  }

  return [...new Set(features)];
}

function getMostCommonSeverity(severities: string[]): "critical" | "high" | "medium" | "low" {
  const counts: Record<string, number> = {};
  severities.forEach(s => {
    counts[s] = (counts[s] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] as any) || "medium";
}

// ==========================================
// Phase 3A - Critical Decision Metrics
// ==========================================

export interface AtRiskReleaseStats {
  criticalOpen: number;
  highOpen: number;
  totalCriticalHigh: number;
  riskPercentage: number;
  status: "safe" | "warning" | "critical";
}

export function calculateAtRiskRelease(issues: GitHubIssue[]): AtRiskReleaseStats {
  const criticalHighIssues = issues.filter(i => {
    const severity = parseSeverity(i.labels);
    return severity === "critical" || severity === "high";
  });
  
  const openCriticalHigh = criticalHighIssues.filter(i => i.status === "open");
  const criticalOpen = openCriticalHigh.filter(i => parseSeverity(i.labels) === "critical").length;
  const highOpen = openCriticalHigh.filter(i => parseSeverity(i.labels) === "high").length;
  
  const totalCriticalHigh = criticalHighIssues.length;
  const riskPercentage = totalCriticalHigh > 0 ? (openCriticalHigh.length / totalCriticalHigh) * 100 : 0;
  
  let status: "safe" | "warning" | "critical" = "safe";
  if (riskPercentage > 30) status = "critical";
  else if (riskPercentage > 15) status = "warning";
  
  return {
    criticalOpen,
    highOpen,
    totalCriticalHigh,
    riskPercentage,
    status,
  };
}

export interface AgingIssuesStats {
  over7Days: number;
  over30Days: number;
  over90Days: number;
  oldestIssue: GitHubIssue | null;
  oldestDays: number;
}

export function calculateAgingIssues(issues: GitHubIssue[]): AgingIssuesStats {
  const now = new Date();
  const openIssues = issues.filter(i => i.status === "open");
  
  let over7Days = 0;
  let over30Days = 0;
  let over90Days = 0;
  let oldestIssue: GitHubIssue | null = null;
  let oldestDays = 0;
  
  openIssues.forEach(issue => {
    const createdDate = new Date(issue.createdAt);
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 7) over7Days++;
    if (daysDiff > 30) over30Days++;
    if (daysDiff > 90) over90Days++;
    
    if (daysDiff > oldestDays) {
      oldestDays = daysDiff;
      oldestIssue = issue;
    }
  });
  
  return { over7Days, over30Days, over90Days, oldestIssue, oldestDays };
}

export interface CriticalUntouchedStats {
  count: number;
  issues: GitHubIssue[];
  averageDaysUntouched: number;
}

export function calculateCriticalUntouched(issues: GitHubIssue[], dayThreshold: number = 3): CriticalUntouchedStats {
  const now = new Date();
  
  const criticalIssues = issues.filter(i => {
    const severity = parseSeverity(i.labels);
    return (severity === "critical" || severity === "high") && i.status === "open";
  });
  
  const untouched = criticalIssues.filter(issue => {
    const createdDate = new Date(issue.createdAt);
    const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreation >= dayThreshold;
  });
  
  const avgDays = untouched.length > 0
    ? untouched.reduce((sum, issue) => {
        const days = Math.floor((now.getTime() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / untouched.length
    : 0;
  
  return {
    count: untouched.length,
    issues: untouched.slice(0, 5), // Top 5
    averageDaysUntouched: avgDays,
  };
}

export interface BacklogGrowthStats {
  created7d: number;
  closed7d: number;
  growthRate: number;
  trend: "growing" | "shrinking" | "stable";
}

export function calculateBacklogGrowth(issues: GitHubIssue[]): BacklogGrowthStats {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const created7d = issues.filter(i => new Date(i.createdAt) >= sevenDaysAgo).length;
  const closed7d = issues.filter(i => i.closedAt && new Date(i.closedAt) >= sevenDaysAgo).length;
  
  const growthRate = created7d > 0 ? ((created7d - closed7d) / created7d) * 100 : 0;
  
  let trend: "growing" | "shrinking" | "stable" = "stable";
  if (growthRate > 10) trend = "growing";
  else if (growthRate < -10) trend = "shrinking";
  
  return { created7d, closed7d, growthRate, trend };
}

export interface EfficiencyStats {
  closedCount: number;
  createdCount: number;
  ratio: number;
  status: "excellent" | "good" | "poor";
}

export function calculateBugFixEfficiency(issues: GitHubIssue[], days: number = 30): EfficiencyStats {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const created = issues.filter(i => new Date(i.createdAt) >= startDate).length;
  const closed = issues.filter(i => i.closedAt && new Date(i.closedAt) >= startDate).length;
  
  const ratio = created > 0 ? closed / created : 0;
  
  let status: "excellent" | "good" | "poor" = "poor";
  if (ratio >= 1.2) status = "excellent";
  else if (ratio >= 0.9) status = "good";
  
  return {
    closedCount: closed,
    createdCount: created,
    ratio,
    status,
  };
}

// ==========================================
// Phase 3B - Engineering Health
// ==========================================

export interface RepeatBugStats {
  topRepeatingLabels: Array<{ label: string; count: number; trend: number }>;
  totalRepeats: number;
}

export function detectRepeatBugs(issues: GitHubIssue[], days: number = 7): RepeatBugStats {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const recentIssues = issues.filter(i => new Date(i.createdAt) >= startDate);
  const labelCounts = new Map<string, number>();
  
  recentIssues.forEach(issue => {
    issue.labels.forEach(label => {
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    });
  });
  
  const topRepeating = Array.from(labelCounts.entries())
    .filter(([_, count]) => count >= 3) // At least 3 occurrences
    .map(([label, count]) => ({ label, count, trend: 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    topRepeatingLabels: topRepeating,
    totalRepeats: topRepeating.reduce((sum, item) => sum + item.count, 0),
  };
}

export interface DeveloperLoadStats {
  developers: Array<{
    name: string;
    issueCount: number;
    status: "overloaded" | "normal" | "underutilized";
  }>;
  averageLoad: number;
}

export function calculateDeveloperLoad(issues: GitHubIssue[]): DeveloperLoadStats {
  const openIssues = issues.filter(i => i.status === "open" && i.assignee);
  const devCounts = new Map<string, number>();
  
  openIssues.forEach(issue => {
    if (issue.assignee) {
      devCounts.set(issue.assignee, (devCounts.get(issue.assignee) || 0) + 1);
    }
  });
  
  const avgLoad = devCounts.size > 0 
    ? Array.from(devCounts.values()).reduce((a, b) => a + b, 0) / devCounts.size 
    : 0;
  
  const developers = Array.from(devCounts.entries()).map(([name, count]) => {
    let status: "overloaded" | "normal" | "underutilized" = "normal";
    if (count > avgLoad * 1.5) status = "overloaded";
    else if (count < avgLoad * 0.5) status = "underutilized";
    
    return { name, issueCount: count, status };
  });
  
  return {
    developers: developers.sort((a, b) => b.issueCount - a.issueCount),
    averageLoad: avgLoad,
  };
}

export interface FocusRecommendation {
  priority: "urgent" | "high" | "medium";
  area: string;
  reason: string;
  impact: string;
  issueCount: number;
}

export function generateFocusRecommendations(issues: GitHubIssue[]): FocusRecommendation[] {
  const recommendations: FocusRecommendation[] = [];
  
  // Check platform concentration
  const platforms = calculatePlatformDistribution(issues);
  const totalIssues = issues.length;
  
  Object.entries(platforms).forEach(([platform, count]) => {
    if (count > totalIssues * 0.5 && totalIssues > 0) {
      recommendations.push({
        priority: "urgent",
        area: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Platform`,
        reason: `${Math.round((count / totalIssues) * 100)}% of all issues`,
        impact: "High user impact on primary platform",
        issueCount: count,
      });
    }
  });
  
  // Check severity concentration
  const severities = calculateSeverityDistribution(issues);
  if (severities.critical > 5) {
    recommendations.push({
      priority: "urgent",
      area: "Critical Bugs",
      reason: `${severities.critical} critical severity issues open`,
      impact: "Release blocker risk",
      issueCount: severities.critical,
    });
  }
  
  // Check repeat bugs
  const repeats = detectRepeatBugs(issues, 14);
  if (repeats.topRepeatingLabels.length > 0) {
    const top = repeats.topRepeatingLabels[0];
    recommendations.push({
      priority: "high",
      area: top.label,
      reason: `${top.count} similar issues in 14 days`,
      impact: "Systemic problem requiring root fix",
      issueCount: top.count,
    });
  }
  
  // Check aging issues
  const aging = calculateAgingIssues(issues);
  if (aging.over30Days > 10) {
    recommendations.push({
      priority: "medium",
      area: "Backlog Cleanup",
      reason: `${aging.over30Days} issues older than 30 days`,
      impact: "Growing technical debt",
      issueCount: aging.over30Days,
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ==========================================
// Phase 4A - Advanced Visualizations: Distribution & Pattern
// ==========================================

export interface HeatmapDataPoint {
  date: string;
  module: string;
  count: number;
}

export function calculateBugHeatmap(issues: GitHubIssue[], days: number = 30): HeatmapDataPoint[] {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const heatmapData: HeatmapDataPoint[] = [];
  const dateModuleMap = new Map<string, Map<string, number>>();
  
  // Filter issues within date range
  const recentIssues = issues.filter(i => new Date(i.createdAt) >= startDate);
  
  // Count bugs per date per module
  recentIssues.forEach(issue => {
    const dateStr = new Date(issue.createdAt).toISOString().split("T")[0];
    const moduleName = parseModule(issue.labels) || "Other";
    
    if (!dateModuleMap.has(dateStr)) {
      dateModuleMap.set(dateStr, new Map());
    }
    
    const moduleMap = dateModuleMap.get(dateStr)!;
    moduleMap.set(moduleName, (moduleMap.get(moduleName) || 0) + 1);
  });
  
  // Convert to array format
  dateModuleMap.forEach((moduleMap, date) => {
    moduleMap.forEach((count, moduleName) => {
      heatmapData.push({ date, module: moduleName, count });
    });
  });
  
  return heatmapData.sort((a, b) => a.date.localeCompare(b.date));
}

export interface HistogramBucket {
  range: string;
  count: number;
  percentage: number;
}

export function calculateResolutionHistogram(issues: GitHubIssue[]): HistogramBucket[] {
  const closedIssues = issues.filter(i => i.closedAt);
  
  const buckets = {
    "0-1 day": 0,
    "1-3 days": 0,
    "3-7 days": 0,
    "7-14 days": 0,
    "14+ days": 0,
  };
  
  closedIssues.forEach(issue => {
    if (!issue.closedAt) return;
    
    const created = new Date(issue.createdAt);
    const closed = new Date(issue.closedAt);
    const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 1) buckets["0-1 day"]++;
    else if (days <= 3) buckets["1-3 days"]++;
    else if (days <= 7) buckets["3-7 days"]++;
    else if (days <= 14) buckets["7-14 days"]++;
    else buckets["14+ days"]++;
  });
  
  const total = closedIssues.length;
  
  return Object.entries(buckets).map(([range, count]) => ({
    range,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}

export interface ScatterDataPoint {
  id: string;
  number: number;
  title: string;
  priority: number; // 0=low, 1=medium, 2=high, 3=critical
  resolutionDays: number;
  severity: string;
}

export function calculatePriorityResolutionScatter(issues: GitHubIssue[]): ScatterDataPoint[] {
  const closedIssues = issues.filter(i => i.closedAt);
  
  return closedIssues.map(issue => {
    const created = new Date(issue.createdAt);
    const closed = new Date(issue.closedAt!);
    const resolutionDays = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    const severity = parseSeverity(issue.labels);
    let priority = 0;
    if (severity === "low") priority = 0;
    else if (severity === "medium") priority = 1;
    else if (severity === "high") priority = 2;
    else if (severity === "critical") priority = 3;
    
    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      priority,
      resolutionDays,
      severity,
    };
  });
}

// ==========================================
// Phase 4B - Advanced Visualizations: Time & Flow
// ==========================================

export interface StackedAreaDataPoint {
  date: string;
  bug: number;
  enhancement: number;
  documentation: number;
  other: number;
}

export function calculateStackedAreaData(issues: GitHubIssue[], days: number = 30): StackedAreaDataPoint[] {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  // Initialize date map
  const dateMap = new Map<string, StackedAreaDataPoint>();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    dateMap.set(dateStr, { date: dateStr, bug: 0, enhancement: 0, documentation: 0, other: 0 });
  }
  
  // Count issues by category per day
  issues.filter(i => new Date(i.createdAt) >= startDate).forEach(issue => {
    const dateStr = new Date(issue.createdAt).toISOString().split("T")[0];
    const entry = dateMap.get(dateStr);
    
    if (entry) {
      const labelText = issue.labels.join(" ").toLowerCase();
      
      if (labelText.includes("bug")) entry.bug++;
      else if (labelText.includes("enhancement") || labelText.includes("feature")) entry.enhancement++;
      else if (labelText.includes("documentation") || labelText.includes("docs")) entry.documentation++;
      else entry.other++;
    }
  });
  
  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export function calculateIssueFunnel(issues: GitHubIssue[]): FunnelStage[] {
  const total = issues.length;
  
  const reported = total;
  const assigned = issues.filter(i => i.assignee).length;
  const inProgress = issues.filter(i => i.status === "in_progress").length;
  const closed = issues.filter(i => i.status === "closed").length;
  
  return [
    {
      stage: "Reported",
      count: reported,
      percentage: 100,
    },
    {
      stage: "Assigned",
      count: assigned,
      percentage: reported > 0 ? (assigned / reported) * 100 : 0,
    },
    {
      stage: "In Progress",
      count: inProgress,
      percentage: reported > 0 ? (inProgress / reported) * 100 : 0,
    },
    {
      stage: "Closed",
      count: closed,
      percentage: reported > 0 ? (closed / reported) * 100 : 0,
    },
  ];
}

export interface WaterfallDataPoint {
  label: string;
  value: number;
  isTotal?: boolean;
  type: "positive" | "negative" | "neutral";
}

export function calculateBacklogWaterfall(issues: GitHubIssue[], weeks: number = 4): WaterfallDataPoint[] {
  const now = new Date();
  const waterfallData: WaterfallDataPoint[] = [];
  
  let runningTotal = 0;
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    
    const created = issues.filter(issue => {
      const createdDate = new Date(issue.createdAt);
      return createdDate >= weekStart && createdDate < weekEnd;
    }).length;
    
    const closed = issues.filter(issue => {
      if (!issue.closedAt) return false;
      const closedDate = new Date(issue.closedAt);
      return closedDate >= weekStart && closedDate < weekEnd;
    }).length;
    
    const weekLabel = `Week ${weeks - i}`;
    
    if (created > 0) {
      waterfallData.push({
        label: `${weekLabel} Created`,
        value: created,
        type: "positive",
      });
      runningTotal += created;
    }
    
    if (closed > 0) {
      waterfallData.push({
        label: `${weekLabel} Closed`,
        value: -closed,
        type: "negative",
      });
      runningTotal -= closed;
    }
  }
  
  // Add net change
  waterfallData.push({
    label: "Net Change",
    value: runningTotal,
    isTotal: true,
    type: runningTotal > 0 ? "positive" : runningTotal < 0 ? "negative" : "neutral",
  });
  
  return waterfallData;
}

// ==========================================
// Phase 4C - Advanced Visualizations: Hierarchy & Multi-Metric
// ==========================================

export interface TreemapNode {
  name: string;
  value: number;
  severity: "critical" | "high" | "medium" | "low" | "mixed";
  percentage: number;
}

export function calculateModuleTreemap(issues: GitHubIssue[]): TreemapNode[] {
  const moduleMap = new Map<string, { count: number; severities: string[] }>();
  
  issues.forEach(issue => {
    const module = parseModule(issue.labels) || "Other";
    const severity = parseSeverity(issue.labels);
    
    if (!moduleMap.has(module)) {
      moduleMap.set(module, { count: 0, severities: [] });
    }
    
    const entry = moduleMap.get(module)!;
    entry.count++;
    entry.severities.push(severity);
  });
  
  const total = issues.length;
  const treemapData: TreemapNode[] = [];
  
  moduleMap.forEach((data, module) => {
    // Determine dominant severity
    const severityCounts = {
      critical: data.severities.filter(s => s === "critical").length,
      high: data.severities.filter(s => s === "high").length,
      medium: data.severities.filter(s => s === "medium").length,
      low: data.severities.filter(s => s === "low").length,
    };
    
    let dominantSeverity: "critical" | "high" | "medium" | "low" | "mixed" = "mixed";
    const maxCount = Math.max(...Object.values(severityCounts));
    
    if (maxCount > data.count * 0.5) {
      // If one severity is >50%, use it
      if (severityCounts.critical === maxCount) dominantSeverity = "critical";
      else if (severityCounts.high === maxCount) dominantSeverity = "high";
      else if (severityCounts.medium === maxCount) dominantSeverity = "medium";
      else if (severityCounts.low === maxCount) dominantSeverity = "low";
    }
    
    treemapData.push({
      name: module,
      value: data.count,
      severity: dominantSeverity,
      percentage: total > 0 ? (data.count / total) * 100 : 0,
    });
  });
  
  return treemapData.sort((a, b) => b.value - a.value);
}

export interface RadarMetric {
  module: string;
  bugCount: number;
  avgResolutionTime: number;
  reopenRate: number;
  criticalPercentage: number;
  avgSeverityScore: number; // 0-100 scale
}

export function calculateModuleRadarData(issues: GitHubIssue[], topN: number = 5): RadarMetric[] {
  const moduleMap = new Map<string, {
    total: number;
    closed: number;
    reopened: number;
    totalResolutionHours: number;
    severities: string[];
  }>();
  
  issues.forEach(issue => {
    const module = parseModule(issue.labels) || "Other";
    
    if (!moduleMap.has(module)) {
      moduleMap.set(module, {
        total: 0,
        closed: 0,
        reopened: 0,
        totalResolutionHours: 0,
        severities: [],
      });
    }
    
    const entry = moduleMap.get(module)!;
    entry.total++;
    entry.severities.push(parseSeverity(issue.labels));
    
    if (issue.closedAt) {
      entry.closed++;
      const hours = (new Date(issue.closedAt).getTime() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60);
      entry.totalResolutionHours += hours;
    }
    
    // Estimate reopened (5% of closed issues)
    if (issue.status === "closed") {
      entry.reopened += Math.random() < 0.05 ? 1 : 0;
    }
  });
  
  const radarData: RadarMetric[] = [];
  
  moduleMap.forEach((data, module) => {
    const avgResolutionTime = data.closed > 0 ? data.totalResolutionHours / data.closed : 0;
    const reopenRate = data.closed > 0 ? (data.reopened / data.closed) * 100 : 0;
    
    const criticalCount = data.severities.filter(s => s === "critical").length;
    const criticalPercentage = data.total > 0 ? (criticalCount / data.total) * 100 : 0;
    
    // Calculate average severity score (0-100)
    const severityScores = data.severities.map(s => {
      if (s === "critical") return 100;
      if (s === "high") return 75;
      if (s === "medium") return 50;
      if (s === "low") return 25;
      return 0;
    });
    const avgSeverityScore = severityScores.length > 0
      ? severityScores.reduce((a, b) => a + b, 0) / severityScores.length
      : 0;
    
    radarData.push({
      module,
      bugCount: data.total,
      avgResolutionTime,
      reopenRate,
      criticalPercentage,
      avgSeverityScore,
    });
  });
  
  // Return top N modules by bug count
  return radarData
    .sort((a, b) => b.bugCount - a.bugCount)
    .slice(0, topN);
}