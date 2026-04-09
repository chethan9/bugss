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
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const dateMap = new Map<string, { created: number; closed: number }>();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    dateMap.set(dateStr, { created: 0, closed: 0 });
  }
  
  issues.forEach(issue => {
    const createdDate = new Date(issue.createdAt).toISOString().split("T")[0];
    if (dateMap.has(createdDate)) {
      dateMap.get(createdDate)!.created++;
    }
    
    if (issue.closedAt) {
      const closedDate = new Date(issue.closedAt).toISOString().split("T")[0];
      if (dateMap.has(closedDate)) {
        dateMap.get(closedDate)!.closed++;
      }
    }
  });
  
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