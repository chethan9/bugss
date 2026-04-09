"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProgressBar } from "@/components/ProgressBar";
import { IssueTable } from "@/components/IssueTable";
import { FilterMenu } from "@/components/FilterMenu";
import { IssueDetailsModal } from "@/components/IssueDetailsModal";
import { SmartInsights } from "@/components/analytics/SmartInsights";
import { BugSeverityHeatmap } from "@/components/analytics/BugSeverityHeatmap";
import { AverageResolutionTime } from "@/components/analytics/AverageResolutionTime";
import { IssueTrendChart } from "@/components/analytics/IssueTrendChart";
import { ModuleStabilityScore } from "@/components/analytics/ModuleStabilityScore";
import { DateRangeFilter, type DateRange } from "@/components/analytics/DateRangeFilter";
import { ReopenedIssuesTracker } from "@/components/analytics/ReopenedIssuesTracker";
import { BugCategoryBreakdown } from "@/components/analytics/BugCategoryBreakdown";
import { BugHotspots } from "@/components/analytics/BugHotspots";
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
} from "@/services/analyticsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LayoutGrid,
  Github,
  RefreshCw,
  Settings,
  FolderGit2,
  Search,
  AlertCircle,
  Key,
  X,
} from "lucide-react";

interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  status: "open" | "in_progress" | "closed";
  repository: string;
  labels: string[];
  assignee?: string;
  url: string;
  createdAt: string;
  closedAt?: string;
}

export default function Home() {
  const [token, setToken] = useState("");
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const [allRepositories, setAllRepositories] = useState<any[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [showRepoDialog, setShowRepoDialog] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");
  const [tempSelectedRepos, setTempSelectedRepos] = useState<string[]>([]);

  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [issuesError, setIssuesError] = useState("");

  const [filters, setFilters] = useState({
    repositories: [] as string[],
    labels: [] as string[],
    statuses: [] as string[],
    search: "",
  });

  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    const savedToken = localStorage.getItem("github_token");
    if (savedToken) {
      setToken(savedToken);
    } else {
      setShowTokenDialog(true);
    }
  }, []);

  const handleTokenSave = async () => {
    if (!tokenInput.trim()) {
      setTokenError("Please enter a valid token");
      return;
    }

    setIsLoadingRepos(true);
    setTokenError("");

    try {
      const response = await fetch("https://api.github.com/user/repos?per_page=100", {
        headers: {
          Authorization: `Bearer ${tokenInput.trim()}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new Error("Invalid GitHub token. Please check and try again.");
      }

      const repos = await response.json();
      setAllRepositories(repos);
      localStorage.setItem("github_token", tokenInput.trim());
      setToken(tokenInput.trim());
      setShowTokenDialog(false);
      setShowRepoDialog(true);
      setTokenInput("");
    } catch (err: any) {
      setTokenError(err.message || "Failed to fetch repositories");
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleRepoSelection = () => {
    setSelectedRepos(tempSelectedRepos);
    setShowRepoDialog(false);
    if (tempSelectedRepos.length > 0) {
      fetchSelectedIssues(tempSelectedRepos);
    }
  };

  const fetchSelectedIssues = async (repos: string[] = selectedRepos) => {
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
                  Authorization: `Bearer ${token}`,
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

  const filteredRepos = useMemo(() => {
    return allRepositories.filter((repo) =>
      repo.full_name.toLowerCase().includes(repoSearchQuery.toLowerCase())
    );
  }, [allRepositories, repoSearchQuery]);

  const availableRepositories = useMemo(() => {
    return Array.from(new Set(issues.map((issue) => issue.repository)));
  }, [issues]);

  const availableLabels = useMemo(() => {
    const labels = new Set<string>();
    issues.forEach((issue) => {
      issue.labels.forEach((label) => labels.add(label));
    });
    return Array.from(labels).sort();
  }, [issues]);

  const filteredIssues = useMemo(() => {
    let filtered = issues.filter((issue) => {
      if (filters.repositories.length > 0 && !filters.repositories.includes(issue.repository)) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(issue.status)) {
        return false;
      }
      if (filters.labels.length > 0) {
        const hasLabel = filters.labels.some((label) => issue.labels.includes(label));
        if (!hasLabel) return false;
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          issue.title.toLowerCase().includes(search) ||
          String(issue.number).includes(search)
        );
      }
      return true;
    });

    // Apply date range filter
    if (dateRange) {
      filtered = filterIssuesByDateRange(filtered, dateRange.from, dateRange.to);
    }

    return filtered;
  }, [issues, filters, dateRange]);

  const metrics = useMemo(() => {
    const statusCounts = filteredIssues.reduce(
      (acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      statusCounts: {
        open: statusCounts.open || 0,
        inProgress: statusCounts.in_progress || 0,
        closed: statusCounts.closed || 0,
      },
    };
  }, [filteredIssues]);

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
    };
  }, [filteredIssues]);

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredIssues.slice(start, start + itemsPerPage);
  }, [filteredIssues, currentPage]);

  const handleIssueClick = (issue: GitHubIssue) => {
    setSelectedIssue(issue);
    setIsIssueModalOpen(true);
  };

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRepoDialog(true)}
                  className="gap-2"
                >
                  <FolderGit2 className="h-4 w-4" />
                  Manage Repos
                  <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary">
                    {selectedRepos.length}
                  </Badge>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSelectedIssues()}
                  disabled={isLoadingIssues}
                  className="gap-2"
                >
                  {isLoadingIssues ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTokenDialog(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Change Token
            </Button>
            
            <DateRangeFilter 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>
      </header>

      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Connect to GitHub
            </DialogTitle>
            <DialogDescription>
              Enter your GitHub Personal Access Token to fetch repositories
            </DialogDescription>
          </DialogHeader>

          {tokenError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tokenError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Personal Access Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                disabled={isLoadingRepos}
                onKeyDown={(e) => e.key === "Enter" && handleTokenSave()}
              />
              <p className="text-xs text-muted-foreground">
                Create a token at{" "}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub Settings → Developer settings → Personal access tokens
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                Required scopes:{" "}
                <code className="rounded bg-muted px-1 py-0.5">repo</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5">read:user</code>
              </p>
            </div>
            <Button
              onClick={handleTokenSave}
              disabled={isLoadingRepos || !tokenInput.trim()}
              className="w-full gap-2"
            >
              {isLoadingRepos ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              Connect and Load Repositories
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRepoDialog} onOpenChange={setShowRepoDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Repositories to Track</DialogTitle>
            <DialogDescription>
              Choose which repositories you want to monitor for issues
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={repoSearchQuery}
                onChange={(e) => setRepoSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-md p-4">
              {filteredRepos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No repositories found
                </p>
              ) : (
                filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={repo.full_name}
                      checked={tempSelectedRepos.includes(repo.full_name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTempSelectedRepos([...tempSelectedRepos, repo.full_name]);
                        } else {
                          setTempSelectedRepos(
                            tempSelectedRepos.filter((r) => r !== repo.full_name)
                          );
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={repo.full_name}
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        {repo.full_name}
                        {repo.private && (
                          <Badge variant="secondary" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </Label>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {repo.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {tempSelectedRepos.length} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRepoDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRepoSelection}
                  disabled={tempSelectedRepos.length === 0}
                >
                  Save & Fetch Issues
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-6 py-8">
        {selectedRepos.length === 0 ? (
          <Card className="p-12 text-center">
            <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-heading font-semibold mb-2">
              No Repositories Selected
            </h2>
            <p className="text-muted-foreground mb-6">
              Connect your GitHub account and select repositories to view issues
            </p>
            <Button onClick={() => setShowTokenDialog(true)} className="gap-2">
              <Github className="h-4 w-4" />
              Connect GitHub Account
            </Button>
          </Card>
        ) : (
          <>
            {/* Smart Insights - Top of Dashboard */}
            {analytics.insights.length > 0 && (
              <div className="mb-8">
                <SmartInsights insights={analytics.insights} />
              </div>
            )}

            <div className="mb-8">
              <DashboardMetrics
                totalRepos={selectedRepos.length}
                totalIssues={filteredIssues.length}
                openIssues={metrics.statusCounts.open}
                inProgressIssues={metrics.statusCounts.inProgress || 0}
                closedIssues={metrics.statusCounts.closed}
              />
            </div>

            <div className="mb-8">
              <ProgressBar
                open={metrics.statusCounts.open}
                inProgress={metrics.statusCounts.inProgress || 0}
                closed={metrics.statusCounts.closed}
                total={filteredIssues.length}
              />
            </div>

            {/* Analytics Widgets Grid */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BugSeverityHeatmap severities={analytics.severities} />
              <AverageResolutionTime stats={analytics.resolutionTime} />
              <IssueTrendChart data={analytics.trend} days={30} />
              <ModuleStabilityScore stability={analytics.stability} />
              <ReopenedIssuesTracker stats={analytics.reopened} />
              <BugCategoryBreakdown categories={analytics.categories} />
              <BugHotspots hotspots={analytics.hotspots} />
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