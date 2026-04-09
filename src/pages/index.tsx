"use client";

import { useState, useEffect, useMemo } from "react";
import { LayoutGrid, GitBranch, LogOut, Github, AlertCircle, RefreshCw, Key, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProgressBar } from "@/components/ProgressBar";
import { IssueTable, type GitHubIssue } from "@/components/IssueTable";
import { IssueDetailsModal } from "@/components/IssueDetailsModal";
import { FilterMenu } from "@/components/FilterMenu";
import { PDFExport } from "@/components/PDFExport";
import { ReportSettings, DEFAULT_REPORT_CONFIG, type ReportConfig } from "@/components/ReportSettings";
import { WidgetSettings, DEFAULT_VISIBILITY, type WidgetVisibility } from "@/components/WidgetSettings";
import { SmartInsights } from "@/components/analytics/SmartInsights";
import { BugSeverityHeatmap } from "@/components/analytics/BugSeverityHeatmap";
import { AverageResolutionTime } from "@/components/analytics/AverageResolutionTime";
import { IssueTrendChart } from "@/components/analytics/IssueTrendChart";
import { ModuleStabilityScore } from "@/components/analytics/ModuleStabilityScore";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
import { ReopenedIssuesTracker } from "@/components/analytics/ReopenedIssuesTracker";
import { BugCategoryBreakdown } from "@/components/analytics/BugCategoryBreakdown";
import { BugHotspots } from "@/components/analytics/BugHotspots";
import { AtRiskRelease } from "@/components/analytics/AtRiskRelease";
import { AgingIssues } from "@/components/analytics/AgingIssues";
import { CriticalUntouched } from "@/components/analytics/CriticalUntouched";
import { BacklogGrowth } from "@/components/analytics/BacklogGrowth";
import { BugFixEfficiency } from "@/components/analytics/BugFixEfficiency";
import { RepeatBugDetector } from "@/components/analytics/RepeatBugDetector";
import { DeveloperLoad } from "@/components/analytics/DeveloperLoad";
import { FocusRecommendations } from "@/components/analytics/FocusRecommendations";
import { BugHeatmap } from "@/components/analytics/BugHeatmap";
import { ResolutionHistogram } from "@/components/analytics/ResolutionHistogram";
import { PriorityScatterPlot } from "@/components/analytics/PriorityScatterPlot";
import { StackedAreaChart } from "@/components/analytics/StackedAreaChart";
import { IssueFunnelChart } from "@/components/analytics/IssueFunnelChart";
import { BacklogWaterfallChart } from "@/components/analytics/BacklogWaterfallChart";
import { ModuleTreemap } from "@/components/analytics/ModuleTreemap";
import { ModuleRadarChart } from "@/components/analytics/ModuleRadarChart";
import { BulletChart } from "@/components/analytics/BulletChart";
import { fetchUserRepositories, type GitHubRepository } from "@/services/githubService";
import {
  generateSmartInsights,
  calculateSeverityDistribution,
  calculateAverageResolutionTime,
  calculateIssueTrend,
  calculateModuleStability,
  filterIssuesByDateRange,
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
  calculateSparklineData,
} from "@/services/analyticsService";

// ==========================================
// Token Storage Utilities (Security: localStorage)
// ==========================================

const STORAGE_KEYS = {
  TOKEN: "github_token_encoded",
  REPOS: "github_selected_repos",
  REMEMBER: "github_remember_me",
} as const;

function saveTokenToStorage(token: string, repos: string[], remember: boolean) {
  if (!remember) {
    clearStoredCredentials();
    return;
  }
  
  try {
    // Base64 encode for basic obfuscation (NOT encryption)
    const encodedToken = btoa(token);
    localStorage.setItem(STORAGE_KEYS.TOKEN, encodedToken);
    localStorage.setItem(STORAGE_KEYS.REPOS, JSON.stringify(repos));
    localStorage.setItem(STORAGE_KEYS.REMEMBER, "true");
  } catch (error) {
    console.error("Failed to save credentials:", error);
  }
}

function loadTokenFromStorage(): { token: string; repos: string[] } | null {
  try {
    const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER);
    if (remember !== "true") return null;
    
    const encodedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const reposJson = localStorage.getItem(STORAGE_KEYS.REPOS);
    
    if (!encodedToken || !reposJson) return null;
    
    const token = atob(encodedToken);
    const repos = JSON.parse(reposJson);
    
    return { token, repos };
  } catch (error) {
    console.error("Failed to load credentials:", error);
    return null;
  }
}

function clearStoredCredentials() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REPOS);
  localStorage.removeItem(STORAGE_KEYS.REMEMBER);
}

export default function Home() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [githubToken, setGithubToken] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [rememberMe, setRememberMe] = useState(false);
  const [isStoredConnection, setIsStoredConnection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  
  // Repository selection state
  const [availableRepos, setAvailableRepos] = useState<GitHubRepository[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");
  const [connectionStep, setConnectionStep] = useState<"token" | "repos">("token");
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  
  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>(DEFAULT_VISIBILITY);
  const [reportConfig, setReportConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG);

  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [issuesError, setIssuesError] = useState("");

  const [filters, setFilters] = useState({
    repositories: [] as string[],
    labels: [] as string[],
    statuses: [] as string[],
    search: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load widget visibility preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("widgetVisibility");
    if (saved) {
      try {
        setWidgetVisibility(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load widget preferences:", e);
      }
    }

    const savedReportConfig = localStorage.getItem("reportConfig");
    if (savedReportConfig) {
      try {
        setReportConfig(JSON.parse(savedReportConfig));
      } catch (e) {
        console.error("Failed to load report config:", e);
      }
    }
  }, []);

  // Save widget visibility preferences to localStorage
  const handleVisibilityChange = (newVisibility: WidgetVisibility) => {
    setWidgetVisibility(newVisibility);
    localStorage.setItem("widgetVisibility", JSON.stringify(newVisibility));
  };

  // Save report config to localStorage
  const handleReportConfigChange = (newConfig: ReportConfig) => {
    setReportConfig(newConfig);
    localStorage.setItem("reportConfig", JSON.stringify(newConfig));
  };

  // Auto-connect on mount if credentials stored
  useEffect(() => {
    const stored = loadTokenFromStorage();
    if (stored) {
      setGithubToken(stored.token);
      setSelectedRepos(stored.repos);
      setIsStoredConnection(true);
      setToken(stored.token);
      
      // Auto-fetch issues
      if (stored.token && stored.repos.length > 0) {
        handleFetchIssues(stored.token, stored.repos);
      }
    }
  }, []);

  const handleFetchIssues = async (tokenParam?: string, reposParam?: string[]) => {
    const tokenToUse = tokenParam || githubToken;
    const reposToUse = reposParam || selectedRepos;
    
    if (!tokenToUse || reposToUse.length === 0) {
      alert("Please provide a GitHub token and select repositories");
      return;
    }

    setLoading(true);
    setIsLoadingIssues(true);
    try {
      // Use fetchSelectedIssues which correctly uses token and selectedRepos state
      // We'll set the token and repos state first
      setToken(tokenToUse);
      setSelectedRepos(reposToUse);
      await fetchSelectedIssues(reposToUse, tokenToUse);
      
      // Save to storage if "Remember me" is checked
      if (rememberMe && !tokenParam) {
        saveTokenToStorage(tokenToUse, reposToUse, true);
        setIsStoredConnection(true);
      }
    } catch (error: any) {
      console.error("Failed to fetch issues:", error);
      alert(`Error: ${error.message}`);
      
      // Clear stored credentials if token is invalid
      if (error.message.includes("401") || error.message.includes("Bad credentials")) {
        clearStoredCredentials();
        setIsStoredConnection(false);
      }
    } finally {
      setLoading(false);
      setIsLoadingIssues(false);
    }
  };

  // Handle token submission - fetch repositories
  const handleTokenSubmit = async () => {
    if (!githubToken) {
      alert("Please enter a GitHub token");
      return;
    }

    setIsLoadingRepos(true);
    try {
      const repos = await fetchUserRepositories(githubToken);
      setAvailableRepos(repos);
      setConnectionStep("repos");
      setToken(githubToken); // Store token in state for later use
    } catch (error: any) {
      console.error("Failed to fetch repositories:", error);
      alert(error.message || "Failed to fetch repositories. Please check your token.");
      
      // Clear stored credentials if token is invalid
      if (error.message.includes("Invalid") || error.message.includes("401")) {
        clearStoredCredentials();
        setIsStoredConnection(false);
      }
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Handle repository selection and issue fetching
  const handleRepoSelectionComplete = async () => {
    if (selectedRepos.length === 0) {
      alert("Please select at least one repository");
      return;
    }

    setLoading(true);
    setIsLoadingIssues(true);
    try {
      await fetchSelectedIssues(selectedRepos, token);
      
      // Save to storage if "Remember me" is checked
      if (rememberMe) {
        saveTokenToStorage(githubToken, selectedRepos, true);
        setIsStoredConnection(true);
      }
      
      setShowConnectionDialog(false);
      setConnectionStep("token");
    } catch (error: any) {
      console.error("Failed to fetch issues:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setIsLoadingIssues(false);
    }
  };

  const fetchSelectedIssues = async (repos: string[] = selectedRepos, tokenToUse: string = token) => {
    setIsLoadingIssues(true);
    setIssuesError("");

    try {
      const allFetchedIssues: GitHubIssue[] = [];

      await Promise.all(
        repos.map(async (repoFullName) => {
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(
              `https://api.github.com/repos/${repoFullName}/issues?state=all&per_page=100&page=${page}`,
              {
                headers: {
                  Authorization: `Bearer ${tokenToUse}`,
                  Accept: "application/vnd.github.v3+json",
                },
              }
            );

            if (!response.ok) {
              hasMore = false;
              break;
            }

            const repoIssues = await response.json();
            const actualIssues = repoIssues.filter((item: any) => !item.pull_request);

            allFetchedIssues.push(
              ...actualIssues.map((issue: any): GitHubIssue => ({
                id: String(issue.id),
                number: issue.number,
                title: issue.title,
                status: issue.state === "open" ? "open" : "closed",
                repository: repoFullName,
                labels: (issue.labels || []).map((l: any) => typeof l === "string" ? l : l.name),
                assignee: issue.assignees?.[0]?.login || issue.assignee?.login,
                url: issue.html_url,
                createdAt: issue.created_at,
                closedAt: issue.closed_at || undefined,
              }))
            );

            if (repoIssues.length < 100) {
              hasMore = false;
            } else {
              page++;
            }
          }
        })
      );

      allFetchedIssues.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setIssues(allFetchedIssues);
      setCurrentPage(1);
    } catch (err: any) {
      setIssuesError(err.message || "Failed to fetch issues");
    } finally {
      setIsLoadingIssues(false);
    }
  };

  // Deselect all repos
  const deselectAllRepos = () => {
    setSelectedRepos([]);
  };

  // Extract unique labels and repositories for filters
  const availableLabels = useMemo(() => {
    const labelSet = new Set<string>();
    issues.forEach((issue) => issue.labels.forEach((l) => labelSet.add(l)));
    return Array.from(labelSet).sort();
  }, [issues]);

  const availableRepositories = useMemo(() => {
    const repoSet = new Set<string>();
    issues.forEach((issue) => repoSet.add(issue.repository));
    return Array.from(repoSet).sort();
  }, [issues]);

  // Filter issues based on all active filters
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filters.repositories.length > 0 && !filters.repositories.includes(issue.repository)) return false;
      if (filters.labels.length > 0) {
        const hasAllLabels = filters.labels.every((l) => issue.labels.includes(l));
        if (!hasAllLabels) return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(issue.status)) return false;
      if (dateRange.start && new Date(issue.createdAt) < dateRange.start) return false;
      if (dateRange.end && new Date(issue.createdAt) > dateRange.end) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(query);
        const matchesNumber = issue.number.toString().includes(query);
        if (!matchesTitle && !matchesNumber) return false;
      }
      return true;
    });
  }, [issues, filters, dateRange]);

  // Calculate analytics
  const analytics = useMemo(() => {
    return {
      insights: generateSmartInsights(filteredIssues),
      severities: calculateSeverityDistribution(filteredIssues),
      resolutionTime: calculateAverageResolutionTime(filteredIssues),
      trend: calculateIssueTrend(filteredIssues, 30),
      stability: calculateModuleStability(filteredIssues),
      reopened: calculateReopenedIssues(filteredIssues),
      categories: calculateCategoryBreakdown(filteredIssues),
      hotspots: calculateBugHotspots(filteredIssues, 5),
      atRiskRelease: calculateAtRiskRelease(filteredIssues),
      agingIssues: calculateAgingIssues(filteredIssues),
      criticalUntouched: calculateCriticalUntouched(filteredIssues, 3),
      backlogGrowth: calculateBacklogGrowth(filteredIssues),
      bugFixEfficiency: calculateBugFixEfficiency(filteredIssues, 30),
      repeatBugs: detectRepeatBugs(filteredIssues, 7),
      developerLoad: calculateDeveloperLoad(filteredIssues),
      focusRecommendations: generateFocusRecommendations(filteredIssues),
      bugHeatmap: calculateBugHeatmap(filteredIssues, 30),
      resolutionHistogram: calculateResolutionHistogram(filteredIssues),
      priorityScatter: calculatePriorityResolutionScatter(filteredIssues),
      stackedAreaData: calculateStackedAreaData(filteredIssues, 30),
      issueFunnel: calculateIssueFunnel(filteredIssues),
      backlogWaterfall: calculateBacklogWaterfall(filteredIssues, 4),
      moduleTreemap: calculateModuleTreemap(filteredIssues),
      moduleRadar: calculateModuleRadarData(filteredIssues, 5),
      kpiMetrics: calculateKPIMetrics(filteredIssues),
      sparklines: {
        open: calculateSparklineData(filteredIssues, "open", 14),
        closed: calculateSparklineData(filteredIssues, "closed", 14),
        created: calculateSparklineData(filteredIssues, "created", 14),
      },
    };
  }, [filteredIssues]);

  // Basic Metrics
  const metrics = useMemo(() => {
    const statusCounts = { open: 0, inProgress: 0, closed: 0 };
    filteredIssues.forEach((issue) => {
      if (issue.status === "open") statusCounts.open++;
      else if (issue.status === "in_progress") statusCounts.inProgress++;
      else if (issue.status === "closed") statusCounts.closed++;
    });
    return { statusCounts };
  }, [filteredIssues]);

  // Pagination
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const paginatedIssues = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredIssues.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredIssues, currentPage]);

  const clearFilters = () => {
    setFilters({
      repositories: [],
      labels: [],
      statuses: [],
      search: "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-heading font-bold text-foreground">
              GitHub Issue Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedRepos.length > 0 && (
              <>
                <ReportSettings 
                  config={reportConfig}
                  onConfigChange={handleReportConfigChange}
                />
                <PDFExport 
                  disabled={filteredIssues.length === 0} 
                  reportConfig={reportConfig}
                />
                <WidgetSettings 
                  visibility={widgetVisibility}
                  onVisibilityChange={handleVisibilityChange}
                />
              </>
            )}
            
            <ThemeSwitch />
            
            {selectedRepos.length > 0 ? (
              <div className="flex items-center gap-2">
                {isStoredConnection && (
                  <Badge variant="outline" className="text-xs">
                    🔓 Stored
                  </Badge>
                )}
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Connect GitHub
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {connectionStep === "token" ? "Connect to GitHub" : "Select Repositories"}
                    </DialogTitle>
                    <DialogDescription>
                      {connectionStep === "token" 
                        ? "Enter your GitHub personal access token to get started." 
                        : `Found ${availableRepos.length} repositories. Select the ones you want to analyze.`
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  {connectionStep === "token" ? (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="token" className="text-sm font-medium">
                          GitHub Personal Access Token
                        </label>
                        <Input
                          id="token"
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxx"
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleTokenSubmit()}
                        />
                        <p className="text-xs text-muted-foreground">
                          Create a token at{" "}
                          <a
                            href="https://github.com/settings/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            GitHub Settings → Developer settings → Personal access tokens
                          </a>
                        </p>
                      </div>

                      <div className="flex items-start space-x-3 rounded-md border border-border bg-muted/50 p-4">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="remember" className="text-sm font-medium cursor-pointer">
                            Remember me (store token locally)
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            ⚠️ Token will be stored in browser localStorage. Only use on trusted devices.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      {/* Search and bulk actions */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search repositories..."
                            value={repoSearchQuery}
                            onChange={(e) => setRepoSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllFilteredRepos}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deselectAllRepos}
                        >
                          Clear
                        </Button>
                      </div>

                      {/* Selected count */}
                      <div className="text-sm text-muted-foreground">
                        {selectedRepos.length} repositories selected
                      </div>

                      {/* Repository list */}
                      <div className="border rounded-md max-h-[400px] overflow-y-auto">
                        {filteredRepos.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            No repositories found
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredRepos.map((repo) => (
                              <div
                                key={repo.id}
                                className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                                onClick={() => toggleRepoSelection(repo.full_name)}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedRepos.includes(repo.full_name)}
                                  onChange={() => toggleRepoSelection(repo.full_name)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">
                                      {repo.full_name}
                                    </span>
                                    {repo.private && (
                                      <Badge variant="outline" className="text-xs">
                                        Private
                                      </Badge>
                                    )}
                                  </div>
                                  {repo.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {repo.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    {repo.language && (
                                      <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                                        {repo.language}
                                      </span>
                                    )}
                                    <span>⭐ {repo.stargazers_count}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    {connectionStep === "repos" && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setConnectionStep("token");
                          setAvailableRepos([]);
                          setSelectedRepos([]);
                        }}
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      onClick={connectionStep === "token" ? handleTokenSubmit : handleRepoSelectionComplete}
                      disabled={
                        connectionStep === "token" 
                          ? !githubToken || isLoadingRepos 
                          : selectedRepos.length === 0 || isLoadingIssues
                      }
                    >
                      {isLoadingRepos ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Fetching Repos...
                        </>
                      ) : isLoadingIssues ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Fetching Issues...
                        </>
                      ) : connectionStep === "token" ? (
                        "Continue"
                      ) : (
                        "Fetch Issues"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {selectedRepos.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <GitBranch className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-heading font-bold mb-2">
              Connect to GitHub
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Connect your GitHub repositories to start analyzing issues and generating insights.
            </p>
          </div>
        ) : (
          <>
            {/* Smart Insights - Top of Dashboard */}
            {widgetVisibility.smartInsights && analytics.insights.length > 0 && (
              <div className="mb-8" id="smart-insights-section">
                <SmartInsights insights={analytics.insights} />
              </div>
            )}

            {widgetVisibility.summaryMetrics && (
              <div className="mb-8" id="summary-metrics-section">
                <DashboardMetrics
                  totalRepos={selectedRepos.length}
                  totalIssues={filteredIssues.length}
                  openIssues={metrics.statusCounts.open}
                  inProgressIssues={metrics.statusCounts.inProgress || 0}
                  closedIssues={metrics.statusCounts.closed}
                  openSparkline={analytics.sparklines.open}
                  closedSparkline={analytics.sparklines.closed}
                  createdSparkline={analytics.sparklines.created}
                />
              </div>
            )}

            {widgetVisibility.progressBar && (
              <div className="mb-8" id="progress-bar-section">
                <ProgressBar
                  open={metrics.statusCounts.open}
                  inProgress={metrics.statusCounts.inProgress || 0}
                  closed={metrics.statusCounts.closed}
                  total={filteredIssues.length}
                />
              </div>
            )}

            {/* Analytics Widgets Grid */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics-widgets-section">
              {widgetVisibility.severityHeatmap && (
                <BugSeverityHeatmap severities={analytics.severities} />
              )}
              {widgetVisibility.resolutionTime && (
                <AverageResolutionTime stats={analytics.resolutionTime} />
              )}
              {widgetVisibility.trendChart && (
                <IssueTrendChart data={analytics.trend} days={30} />
              )}
              {widgetVisibility.moduleStability && (
                <ModuleStabilityScore stability={analytics.stability} />
              )}
              {widgetVisibility.reopenedIssues && (
                <ReopenedIssuesTracker stats={analytics.reopened} />
              )}
              {widgetVisibility.categoryBreakdown && (
                <BugCategoryBreakdown categories={analytics.categories} />
              )}
              {widgetVisibility.bugHotspots && (
                <BugHotspots hotspots={analytics.hotspots} />
              )}
              {widgetVisibility.atRiskRelease && (
                <AtRiskRelease stats={analytics.atRiskRelease} />
              )}
              {widgetVisibility.agingIssues && (
                <AgingIssues stats={analytics.agingIssues} />
              )}
              {widgetVisibility.criticalUntouched && (
                <CriticalUntouched stats={analytics.criticalUntouched} />
              )}
              {widgetVisibility.backlogGrowth && (
                <BacklogGrowth stats={analytics.backlogGrowth} />
              )}
              {widgetVisibility.bugFixEfficiency && (
                <BugFixEfficiency stats={analytics.bugFixEfficiency} />
              )}
              {widgetVisibility.bugFixEfficiency && (
                <BugFixEfficiency stats={analytics.bugFixEfficiency} />
              )}
              {widgetVisibility.repeatBugDetector && (
                <RepeatBugDetector stats={analytics.repeatBugs} />
              )}
              {widgetVisibility.developerLoad && (
                <DeveloperLoad stats={analytics.developerLoad} />
              )}
              {widgetVisibility.focusRecommendations && (
                <FocusRecommendations recommendations={analytics.focusRecommendations} />
              )}
              {widgetVisibility.bugHeatmap && (
                <BugHeatmap data={analytics.bugHeatmap} />
              )}
              {widgetVisibility.resolutionHistogram && (
                <ResolutionHistogram data={analytics.resolutionHistogram} />
              )}
              {widgetVisibility.priorityScatterPlot && (
                <PriorityScatterPlot data={analytics.priorityScatter} />
              )}
              {widgetVisibility.stackedAreaChart && (
                <StackedAreaChart data={analytics.stackedAreaData} />
              )}
              {widgetVisibility.issueFunnelChart && (
                <IssueFunnelChart stages={analytics.issueFunnel} />
              )}
              {widgetVisibility.backlogWaterfallChart && (
                <BacklogWaterfallChart data={analytics.backlogWaterfall} />
              )}
              {widgetVisibility.moduleTreemap && (
                <ModuleTreemap data={analytics.moduleTreemap} />
              )}
              {widgetVisibility.moduleRadarChart && (
                <ModuleRadarChart data={analytics.moduleRadar} />
              )}
              {widgetVisibility.kpiBulletChart && (
                <BulletChart metrics={analytics.kpiMetrics} />
              )}
            </div>

            {/* Label Choice Chips - Compact & Soft Style */}
            {availableLabels.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Filter by Labels
                    {filters.labels.length > 0 && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {filters.labels.length} selected
                      </span>
                    )}
                  </h3>
                  {filters.labels.length > 0 && (
                    <button
                      onClick={() => setFilters({ ...filters, labels: [] })}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
                  {availableLabels.map((label) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (filters.labels.includes(label)) {
                          setFilters({
                            ...filters,
                            labels: filters.labels.filter((l) => l !== label),
                          });
                        } else {
                          setFilters({
                            ...filters,
                            labels: [...filters.labels, label],
                          });
                        }
                      }}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap
                        transition-smooth active-scale
                        ${filters.labels.includes(label)
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-gray-100 text-gray-700 border border-transparent hover:bg-gray-200"
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {issuesError && (
              <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600">{issuesError}</p>
                  </div>
                  <button
                    onClick={() => setIssuesError("")}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div id="issue-table-section">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold">
                    Issues
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Showing {Math.min(filteredIssues.length, itemsPerPage)} of {filteredIssues.length}
                  </span>
                  <FilterMenu
                    repositories={availableRepositories}
                    selectedRepos={filters.repositories}
                    onRepoToggle={(repo) => {
                      if (filters.repositories.includes(repo)) {
                        setFilters({
                          ...filters,
                          repositories: filters.repositories.filter((r) => r !== repo),
                        });
                      } else {
                        setFilters({
                          ...filters,
                          repositories: [...filters.repositories, repo],
                        });
                      }
                    }}
                    allLabels={availableLabels}
                    selectedLabels={filters.labels}
                    onLabelToggle={(label) => {
                      if (filters.labels.includes(label)) {
                        setFilters({
                          ...filters,
                          labels: filters.labels.filter((l) => l !== label),
                        });
                      } else {
                        setFilters({
                          ...filters,
                          labels: [...filters.labels, label],
                        });
                      }
                    }}
                    selectedStatuses={filters.statuses}
                    onStatusToggle={(status) => {
                      if (filters.statuses.includes(status)) {
                        setFilters({
                          ...filters,
                          statuses: filters.statuses.filter((s) => s !== status),
                        });
                      } else {
                        setFilters({
                          ...filters,
                          statuses: [...filters.statuses, status],
                        });
                      }
                    }}
                    onClearFilters={clearFilters}
                  />
                </div>

                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <IssueTable issues={paginatedIssues} onIssueClick={handleIssueClick} />

                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={
                            currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </div>

            {selectedIssue && (
              <IssueDetailsModal
                isOpen={isIssueModalOpen}
                onClose={() => setIsIssueModalOpen(false)}
                issueNumber={selectedIssue.number}
                repository={selectedIssue.repository}
                token={token}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}