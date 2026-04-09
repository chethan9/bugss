import type { GitHubIssue } from "@/components/IssueTable";

/**
 * Analytics service for processing GitHub issues and generating insights
 */

// Date range filtering
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

// Reopened issues detection
export interface ReopenedIssuesStats {
  total: number;
  reopenedCount: number;
  reopenedPercentage: number;
  trend: number; // Positive = increasing, negative = decreasing
}

export function calculateReopenedIssues(issues: GitHubIssue[]): ReopenedIssuesStats {
  // Note: GitHub API doesn't provide reopened status directly
  // This is a simplified calculation based on comments/events
  // In a real implementation, you'd need to fetch issue events
  const closedIssues = issues.filter(i => i.status === "closed");
  
  // Estimate reopened issues (issues closed, then reopened)
  // This would require fetching issue events from GitHub API
  const estimatedReopened = Math.floor(closedIssues.length * 0.05); // Placeholder: 5% estimate
  
  return {
    total: closedIssues.length,
    reopenedCount: estimatedReopened,
    reopenedPercentage: closedIssues.length > 0 ? (estimatedReopened / closedIssues.length) * 100 : 0,
    trend: 0, // Would need historical data
  };
}

// Bug category breakdown
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

export function calculateCategoryBreakdown(issues: GitHubIssue[]): CategoryCount {
  const categories: CategoryCount = {
    ui: 0,
    validation: 0,
    api: 0,
    backend: 0,
    frontend: 0,
    performance: 0,
    security: 0,
    other: 0,
  };

  issues.forEach(issue => {
    const category = detectCategory(issue);
    const allText = `${issue.title} ${issue.labels.join(" ")}`.toLowerCase();
    
    if (allText.includes("ui") || allText.includes("design") || allText.includes("layout")) categories.ui++;
    if (allText.includes("validation") || allText.includes("form")) categories.validation++;
    if (allText.includes("api") || allText.includes("endpoint")) categories.api++;
    if (allText.includes("backend") || allText.includes("server") || allText.includes("database")) categories.backend++;
    if (allText.includes("frontend") || allText.includes("react") || allText.includes("component")) categories.frontend++;
    if (allText.includes("performance") || allText.includes("slow") || allText.includes("speed")) categories.performance++;
    if (allText.includes("security") || allText.includes("vulnerability")) categories.security++;
    
    // If no category detected, count as other
    const hasCategory = categories.ui > 0 || categories.validation > 0 || categories.api > 0 || 
                        categories.backend > 0 || categories.frontend > 0 || 
                        categories.performance > 0 || categories.security > 0;
    if (!hasCategory) categories.other++;
  });

  return categories;
}

// Bug hotspots (top buggy features/modules)
export interface BugHotspot {
  feature: string;
  count: number;
  percentage: number;
  severity: "critical" | "high" | "medium" | "low";
}

export function calculateBugHotspots(issues: GitHubIssue[], limit: number = 5): BugHotspot[] {
  const featureCounts = new Map<string, number>();
  const featureSeverities = new Map<string, string[]>();

  issues.forEach(issue => {
    // Extract feature from labels or title
    const features = extractFeatures(issue);
    
    features.forEach(feature => {
      featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
      
      if (!featureSeverities.has(feature)) {
        featureSeverities.set(feature, []);
      }
      const severity = detectSeverity(issue);
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
      percentage: (count / totalIssues) * 100,
      severity: avgSeverity,
    });
  });

  return hotspots
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function extractFeatures(issue: GitHubIssue): string[] {
  const features: string[] = [];
  
  // Extract from labels
  issue.labels.forEach(label => {
    const lower = label.toLowerCase();
    
    // Look for feature/module labels
    if (lower.includes("page") || lower.includes("panel") || 
        lower.includes("module") || lower.includes("feature") ||
        lower.includes("app") || lower.includes("screen")) {
      features.push(label);
    }
  });

  // Extract from title (look for common patterns)
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

  // If no features found, use repository name or "Other"
  if (features.length === 0) {
    const repoName = issue.repository.split("/")[1] || "Other";
    features.push(repoName);
  }

  return [...new Set(features)]; // Remove duplicates
}

function getMostCommonSeverity(severities: string[]): "critical" | "high" | "medium" | "low" {
  const counts: Record<string, number> = {};
  severities.forEach(s => {
    counts[s] = (counts[s] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] as any) || "medium";
}

/**
 * Parse severity from issue labels
 */
export function parseSeverity(labels: string[]): "critical" | "high" | "medium" | "low" | "unknown" {
  const severityLabels = labels.map(l => l.toLowerCase());
  
  if (severityLabels.some(l => l.includes("critical") || l.includes("blocker"))) return "critical";
  if (severityLabels.some(l => l.includes("high") || l.includes("urgent"))) return "high";
  if (severityLabels.some(l => l.includes("medium") || l.includes("moderate"))) return "medium";
  if (severityLabels.some(l => l.includes("low") || l.includes("minor"))) return "low";
  
  return "unknown";
}

/**
 * Parse category from issue labels
 */
export function parseCategory(labels: string[]): string {
  const labelText = labels.join(" ").toLowerCase();
  
  if (labelText.includes("ui") || labelText.includes("frontend") || labelText.includes("design")) return "ui";
  if (labelText.includes("validation") || labelText.includes("form")) return "validation";
  if (labelText.includes("api") || labelText.includes("backend") || labelText.includes("server")) return "api";
  if (labelText.includes("logic") || labelText.includes("business")) return "logic";
  if (labelText.includes("performance") || labelText.includes("slow") || labelText.includes("optimization")) return "performance";
  
  return "other";
}

/**
 * Parse platform from issue labels
 */
export function parsePlatform(labels: string[]): string {
  const labelText = labels.join(" ").toLowerCase();
  
  if (labelText.includes("android") || labelText.includes("mobile android")) return "android";
  if (labelText.includes("ios") || labelText.includes("iphone") || labelText.includes("ipad")) return "ios";
  if (labelText.includes("web") || labelText.includes("browser")) return "web";
  if (labelText.includes("admin") || labelText.includes("dashboard") || labelText.includes("panel")) return "admin";
  
  return "other";
}

/**
 * Calculate severity distribution
 */
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

/**
 * Calculate category distribution
 */
export function calculateCategoryDistribution(issues: GitHubIssue[]): CategoryCount {
  const counts: CategoryCount = {
    ui: 0,
    validation: 0,
    api: 0,
    logic: 0,
    performance: 0,
    other: 0,
  };
  
  issues.forEach(issue => {
    const category = parseCategory(issue.labels);
    counts[category as keyof CategoryCount]++;
  });
  
  return counts;
}

/**
 * Calculate platform distribution
 */
export function calculatePlatformDistribution(issues: GitHubIssue[]): PlatformCount {
  const counts: PlatformCount = {
    android: 0,
    ios: 0,
    web: 0,
    admin: 0,
    other: 0,
  };
  
  issues.forEach(issue => {
    const platform = parsePlatform(issue.labels);
    counts[platform as keyof PlatformCount]++;
  });
  
  return counts;
}

/**
 * Calculate average resolution time in hours
 */
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
  
  const bySeverity = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  
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

/**
 * Calculate trend data (issues created vs closed over time)
 */
export function calculateIssueTrend(issues: GitHubIssue[], days: number = 30): TrendDataPoint[] {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const dateMap = new Map<string, { created: number; closed: number }>();
  
  // Initialize all dates
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    dateMap.set(dateStr, { created: 0, closed: 0 });
  }
  
  // Count created issues
  issues.forEach(issue => {
    const createdDate = new Date(issue.createdAt).toISOString().split("T")[0];
    if (dateMap.has(createdDate)) {
      const entry = dateMap.get(createdDate)!;
      entry.created++;
    }
    
    if (issue.closedAt) {
      const closedDate = new Date(issue.closedAt).toISOString().split("T")[0];
      if (dateMap.has(closedDate)) {
        const entry = dateMap.get(closedDate)!;
        entry.closed++;
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

/**
 * Calculate module stability scores
 */
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

/**
 * Calculate reopened issues percentage
 */
export function calculateReopenedRate(issues: GitHubIssue[]): number {
  // Note: GitHub API doesn't directly provide "reopened" count
  // This would need timeline events API or custom tracking
  // For now, return 0 as placeholder
  return 0;
}

/**
 * Generate smart insights based on analytics
 */
export interface SmartInsight {
  type: "warning" | "success" | "info";
  message: string;
  severity: "high" | "medium" | "low";
}

export function generateSmartInsights(issues: GitHubIssue[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  
  // Check severity distribution
  const severities = calculateSeverityDistribution(issues);
  const totalBugs = issues.filter(i => i.labels.some(l => l.toLowerCase().includes("bug"))).length;
  
  if (severities.critical > totalBugs * 0.1) {
    insights.push({
      type: "warning",
      message: `${severities.critical} critical bugs detected - ${Math.round((severities.critical / totalBugs) * 100)}% of total bugs`,
      severity: "high",
    });
  }
  
  // Check platform distribution
  const platforms = calculatePlatformDistribution(issues);
  const maxPlatform = Object.entries(platforms).reduce((max, [key, val]) => 
    val > max.value ? { key, value: val } : max, { key: "", value: 0 }
  );
  
  if (maxPlatform.value > issues.length * 0.5) {
    insights.push({
      type: "warning",
      message: `${maxPlatform.key.charAt(0).toUpperCase() + maxPlatform.key.slice(1)} has ${Math.round((maxPlatform.value / issues.length) * 100)}% of all issues`,
      severity: "medium",
    });
  }
  
  // Check trend
  const trend = calculateIssueTrend(issues, 7);
  const recentCreated = trend.slice(-7).reduce((sum, d) => sum + d.created, 0);
  const recentClosed = trend.slice(-7).reduce((sum, d) => sum + d.closed, 0);
  
  if (recentCreated > recentClosed * 1.5) {
    insights.push({
      type: "warning",
      message: "Bug backlog growing: 50% more issues created than closed in the last 7 days",
      severity: "high",
    });
  } else if (recentClosed > recentCreated * 1.2) {
    insights.push({
      type: "success",
      message: "Healthy progress: 20% more issues closed than created in the last 7 days",
      severity: "low",
    });
  }
  
  // Check resolution time
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