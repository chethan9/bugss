"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProgressBar } from "@/components/ProgressBar";
import { IssueTable, type GitHubIssue } from "@/components/IssueTable";
import { FilterPanel } from "@/components/FilterPanel";
import { calculateMetrics } from "@/lib/mockData";
import { Github, LayoutDashboard, Settings, RefreshCw, AlertCircle, Loader2, FolderGit2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IssueDetailsModal } from "@/components/IssueDetailsModal";

interface Repo {
  id: number;
  fullName: string;
  description: string | null;
  private: boolean;
}

export default function Home() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [authError, setAuthError] = useState("");

  const [allRepos, setAllRepos] = useState<Repo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [tempSelectedRepos, setTempSelectedRepos] = useState<string[]>([]);
  const [showRepoDialog, setShowRepoDialog] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");

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

  // Load state on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("github_token");
    const savedRepos = localStorage.getItem("github_selected_repos");
    
    if (savedToken) {
      setToken(savedToken);
      fetchUserRepos(savedToken);
      if (savedRepos) {
        setSelectedRepos(JSON.parse(savedRepos));
      }
    } else {
      setShowTokenDialog(true);
    }
   
  }, []);

  // Fetch issues when selected repos change
  useEffect(() => {
    if (token && selectedRepos.length > 0) {
      fetchSelectedIssues();
    } else if (selectedRepos.length === 0) {
      setIssues([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepos, token]);

  const fetchUserRepos = async (authToken: string) => {
    setIsLoadingRepos(true);
    try {
      const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const data = await res.json();
      setAllRepos(data.map((r: any) => ({
        id: r.id,
        fullName: r.full_name,
        description: r.description,
        private: r.private
      })));
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const saveToken = async () => {
    if (!tokenInput.trim()) {
      setAuthError("Please enter a valid token");
      return;
    }
    
    try {
      // Validate token
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenInput.trim()}` }
      });
      if (!res.ok) throw new Error("Invalid token");
      
      localStorage.setItem("github_token", tokenInput.trim());
      setToken(tokenInput.trim());
      setTokenInput("");
      setShowTokenDialog(false);
      setAuthError("");
      
      // Auto open repo dialog after token
      await fetchUserRepos(tokenInput.trim());
      setTempSelectedRepos(selectedRepos);
      setShowRepoDialog(true);
    } catch (err) {
      setAuthError("Invalid GitHub token. Please check and try again.");
    }
  };

  const openRepoDialog = () => {
    setTempSelectedRepos(selectedRepos);
    setRepoSearch("");
    setShowRepoDialog(true);
  };

  const saveSelectedRepos = () => {
    setSelectedRepos(tempSelectedRepos);
    localStorage.setItem("github_selected_repos", JSON.stringify(tempSelectedRepos));
    setShowRepoDialog(false);
  };

  const fetchSelectedIssues = async () => {
    setIsLoadingIssues(true);
    setIssuesError("");
    
    try {
      const allFetchedIssues: GitHubIssue[] = [];
      
      // Fetch concurrently
      await Promise.all(selectedRepos.map(async (repoFullName) => {
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
            break; // Skip failures silently and stop paging
          }
          
          const repoIssues = await response.json();
          
          // GitHub API returns Pull Requests in the issues endpoint
          // We filter them out so the "Issues" total is accurate
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
            }))
          );

          if (repoIssues.length < 100) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }));
      
      // Sort by newest
      allFetchedIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setIssues(allFetchedIssues);
    } catch (err: any) {
      setIssuesError(err.message || "Failed to fetch issues");
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const resetToken = () => {
    localStorage.removeItem("github_token");
    localStorage.removeItem("github_selected_repos");
    setToken("");
    setSelectedRepos([]);
    setIssues([]);
    setShowTokenDialog(true);
  };

  // Filter issues based on criteria
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filters.repositories.length > 0 && !filters.repositories.includes(issue.repository)) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(issue.status)) {
        return false;
      }
      if (filters.labels.length > 0) {
        if (!filters.labels.some((label) => issue.labels.includes(label))) {
          return false;
        }
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return issue.title.toLowerCase().includes(searchLower) || `#${issue.number}`.includes(searchLower);
      }
      return true;
    });
  }, [issues, filters]);

  const metrics = useMemo(() => calculateMetrics(filteredIssues), [filteredIssues]);

  const availableRepositories = useMemo(() => {
    return Array.from(new Set(issues.map((i) => i.repository)));
  }, [issues]);

  const availableLabels = useMemo(() => {
    const labels = new Set<string>();
    issues.forEach((issue) => {
      issue.labels.forEach((label) => labels.add(label));
    });
    return Array.from(labels).sort();
  }, [issues]);

  const handleIssueClick = (issue: GitHubIssue) => {
    setSelectedIssue(issue);
    setIsIssueModalOpen(true);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Github className="h-8 w-8 text-primary" />
              <h1 className="font-heading text-xl font-bold">GitHub Issue Dashboard</h1>
            </div>
          </div>
        </header>

        <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Personal Access Token
              </DialogTitle>
              <DialogDescription>
                Enter your GitHub token to track repository issues.
              </DialogDescription>
            </DialogHeader>
            {authError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
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
                  onKeyDown={(e) => e.key === "Enter" && saveToken()}
                />
                <p className="text-xs text-muted-foreground">
                  Need a token? <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Create one here</a> (requires <code className="rounded bg-muted px-1 py-0.5">repo</code> scope)
                </p>
              </div>
              <Button onClick={saveToken} className="w-full">Connect to GitHub</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRepoPicker(true)}
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
                  onClick={fetchSelectedIssues}
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
              onClick={() => setShowTokenModal(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Change Token
            </Button>
          </div>
        </div>
      </header>

      {/* Repo Selection Dialog */}
      <Dialog open={showRepoDialog} onOpenChange={setShowRepoDialog}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Track Repositories</DialogTitle>
            <DialogDescription>Select which repositories to fetch issues from.</DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <Input 
              placeholder="Search your repositories..." 
              value={repoSearch} 
              onChange={e => setRepoSearch(e.target.value)} 
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            {isLoadingRepos ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading repositories from GitHub...</p>
              </div>
            ) : allRepos.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">No repositories found.</p>
            ) : (
              allRepos
                .filter(r => r.fullName.toLowerCase().includes(repoSearch.toLowerCase()))
                .map(repo => (
                <div key={repo.id} className="flex items-start space-x-3 p-3 hover:bg-accent/50 rounded-md transition-colors border border-transparent hover:border-border">
                  <Checkbox
                    id={`repo-${repo.id}`}
                    checked={tempSelectedRepos.includes(repo.fullName)}
                    onCheckedChange={(checked) => {
                      if (checked) setTempSelectedRepos([...tempSelectedRepos, repo.fullName]);
                      else setTempSelectedRepos(tempSelectedRepos.filter(r => r !== repo.fullName));
                    }}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none flex-1">
                    <label htmlFor={`repo-${repo.id}`} className="text-sm font-medium leading-none cursor-pointer flex items-center">
                      {repo.fullName}
                      {repo.private && <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1 py-0">Private</Badge>}
                    </label>
                    {repo.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{repo.description}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t mt-auto">
            <p className="text-sm text-muted-foreground">{tempSelectedRepos.length} selected</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRepoDialog(false)}>Cancel</Button>
              <Button onClick={saveSelectedRepos}>Save & Fetch</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {issuesError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{issuesError}</AlertDescription>
          </Alert>
        )}

        {selectedRepos.length > 0 ? (
          <>
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
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-lg font-semibold">
                  Issue Progress - {metrics.completionRate}% completed
                </h3>
              </div>
              <ProgressBar segments={metrics.segments} completionRate={metrics.completionRate} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <FilterPanel
                repositories={availableRepositories}
                labels={availableLabels}
                statuses={[
                  { value: "open", label: "Open", count: metrics.statusCounts.open },
                  { value: "closed", label: "Closed", count: metrics.statusCounts.closed },
                ]}
                selectedRepos={filters.repositories}
                selectedLabels={filters.labels}
                selectedStatuses={filters.statuses}
                searchQuery={filters.search}
                onRepoToggle={(repo) =>
                  setFilters((prev) => ({
                    ...prev,
                    repositories: prev.repositories.includes(repo)
                      ? prev.repositories.filter((r) => r !== repo)
                      : [...prev.repositories, repo],
                  }))
                }
                onLabelToggle={(label) =>
                  setFilters((prev) => ({
                    ...prev,
                    labels: prev.labels.includes(label)
                      ? prev.labels.filter((l) => l !== label)
                      : [...prev.labels, label],
                  }))
                }
                onStatusToggle={(status) =>
                  setFilters((prev) => ({
                    ...prev,
                    statuses: prev.statuses.includes(status)
                      ? prev.statuses.filter((s) => s !== status)
                      : [...prev.statuses, status],
                  }))
                }
                onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
                onClearFilters={() =>
                  setFilters({
                    repositories: [],
                    labels: [],
                    statuses: [],
                    search: "",
                  })
                }
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold">
                    Issues ({filteredIssues.length})
                  </h3>
                  {isLoadingIssues && <Badge variant="secondary" className="animate-pulse">Syncing...</Badge>}
                </div>
                {filteredIssues.length > 0 ? (
                  <IssueTable issues={filteredIssues} onIssueClick={handleIssueClick} />
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    {isLoadingIssues ? "Fetching issues..." : "No issues found matching your filters."}
                  </Card>
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
        ) : (
          <div className="py-20 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <FolderGit2 className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-4 font-heading text-2xl font-bold">Select Repositories</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Click the button below to choose which of your GitHub repositories you want to track issues for.
            </p>
            <Button onClick={openRepoDialog} size="lg">
              <FolderGit2 className="mr-2 h-5 w-5" />
              Manage Repositories
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}