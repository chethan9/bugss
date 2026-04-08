"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProgressBar } from "@/components/ProgressBar";
import { IssueTable } from "@/components/IssueTable";
import { FilterPanel } from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Github, Key, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  owner: { login: string };
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: Array<{ name: string; color: string }>;
  assignees: Array<{ login: string; avatar_url: string }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  repository_url: string;
}

export default function Home() {
  const [token, setToken] = useState("");
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  
  const [allRepositories, setAllRepositories] = useState<Repository[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState("");
  
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [syncError, setSyncError] = useState("");
  
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Load token from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("github_token");
    if (saved) {
      setStoredToken(saved);
      loadRepositories(saved);
    } else {
      setShowTokenModal(true);
    }

    const savedRepoIds = localStorage.getItem("selected_repo_ids");
    if (savedRepoIds) {
      setSelectedRepoIds(JSON.parse(savedRepoIds));
    }
  }, []);

  // Load issues when selected repos change
  useEffect(() => {
    if (storedToken && selectedRepoIds.length > 0) {
      loadIssues();
    }
  }, [selectedRepoIds, storedToken]);

  const loadRepositories = async (tokenToUse: string) => {
    setIsLoadingRepos(true);
    setRepoError("");
    
    try {
      const { fetchGitHubRepositories } = await import("@/services/githubService");
      const repos = await fetchGitHubRepositories(tokenToUse);
      setAllRepositories(repos);
    } catch (error: any) {
      setRepoError(error.message || "Failed to load repositories");
      console.error("Repository load error:", error);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const loadIssues = async () => {
    if (!storedToken || selectedRepoIds.length === 0) return;
    
    setIsLoadingIssues(true);
    setSyncError("");
    
    try {
      const { fetchGitHubIssues } = await import("@/services/githubService");
      const selectedRepos = allRepositories.filter(r => selectedRepoIds.includes(r.id));
      
      const allIssues: GitHubIssue[] = [];
      for (const repo of selectedRepos) {
        const repoIssues = await fetchGitHubIssues(storedToken, repo.full_name);
        allIssues.push(...repoIssues);
      }
      
      setIssues(allIssues);
    } catch (error: any) {
      setSyncError(error.message || "Failed to load issues");
      console.error("Issues load error:", error);
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const handleSaveToken = async () => {
    if (!token.trim()) {
      setTokenError("Please enter a valid token");
      return;
    }

    setIsLoadingToken(true);
    setTokenError("");

    try {
      // Verify token by fetching user info
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new Error("Invalid GitHub token");
      }

      localStorage.setItem("github_token", token.trim());
      setStoredToken(token.trim());
      await loadRepositories(token.trim());
      setShowTokenModal(false);
      setShowRepoModal(true);
      setToken("");
    } catch (error: any) {
      setTokenError(error.message || "Failed to verify token");
    } finally {
      setIsLoadingToken(false);
    }
  };

  const handleToggleRepo = (repoId: number) => {
    setSelectedRepoIds(prev => {
      const newIds = prev.includes(repoId)
        ? prev.filter(id => id !== repoId)
        : [...prev, repoId];
      localStorage.setItem("selected_repo_ids", JSON.stringify(newIds));
      return newIds;
    });
  };

  const handleChangeToken = () => {
    setShowTokenModal(true);
  };

  // Get unique values for filters
  const uniqueRepos = useMemo(() => {
    const repos = new Set(
      issues.map(issue => {
        const urlParts = issue.repository_url.split("/");
        return urlParts[urlParts.length - 1];
      })
    );
    return Array.from(repos);
  }, [issues]);

  const uniqueLabels = useMemo(() => {
    const labels = new Set<string>();
    issues.forEach(issue => {
      issue.labels.forEach(label => labels.add(label.name));
    });
    return Array.from(labels);
  }, [issues]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const repoName = issue.repository_url.split("/").pop() || "";
      
      if (selectedRepos.length > 0 && !selectedRepos.includes(repoName)) {
        return false;
      }

      if (selectedStatuses.length > 0 && !selectedStatuses.includes(issue.state)) {
        return false;
      }

      if (selectedLabels.length > 0) {
        const issueLabels = issue.labels.map(l => l.name);
        if (!selectedLabels.some(label => issueLabels.includes(label))) {
          return false;
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          issue.title.toLowerCase().includes(query) ||
          issue.body?.toLowerCase().includes(query) ||
          `#${issue.number}`.includes(query)
        );
      }

      return true;
    });
  }, [issues, selectedRepos, selectedLabels, selectedStatuses, searchQuery]);

  // Calculate metrics
  const totalIssues = issues.length;
  const openIssues = issues.filter(i => i.state === "open").length;
  const closedIssues = issues.filter(i => i.state === "closed").length;
  const progressPercentage = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">GitHub Issue Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {storedToken && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowRepoModal(true)}
                >
                  Manage Repositories ({selectedRepoIds.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadIssues}
                  disabled={isLoadingIssues || selectedRepoIds.length === 0}
                >
                  {isLoadingIssues ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Syncing...</>
                  ) : (
                    <><RefreshCw className="h-4 w-4 mr-2" /> Sync Now</>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleChangeToken}>
                  <Key className="h-4 w-4 mr-2" /> Change Token
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Token Modal */}
      <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Connect to GitHub
            </DialogTitle>
            <DialogDescription>
              Enter your GitHub Personal Access Token to view your repositories
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
                value={token} 
                onChange={(e) => setToken(e.target.value)} 
                disabled={isLoadingToken}
                onKeyDown={(e) => e.key === "Enter" && handleSaveToken()}
              />
              <p className="text-xs text-muted-foreground">
                Create a token at{" "}
                <a 
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub Settings → Tokens (classic)
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                Required scopes: <code className="rounded bg-muted px-1 py-0.5">repo</code>, <code className="rounded bg-muted px-1 py-0.5">read:user</code>
              </p>
            </div>
            <Button 
              onClick={handleSaveToken} 
              disabled={isLoadingToken || !token.trim()} 
              className="w-full gap-2"
            >
              {isLoadingToken ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                <><Key className="h-4 w-4" /> Connect</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Repository Selection Modal */}
      <Dialog open={showRepoModal} onOpenChange={setShowRepoModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Repositories to Track</DialogTitle>
            <DialogDescription>
              Choose which repositories you want to fetch issues from
            </DialogDescription>
          </DialogHeader>

          {repoError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{repoError}</AlertDescription>
            </Alert>
          )}

          {isLoadingRepos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading repositories...</span>
            </div>
          ) : allRepositories.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No repositories found</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {allRepositories.map((repo) => (
                <Card key={repo.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`repo-${repo.id}`}
                      checked={selectedRepoIds.includes(repo.id)}
                      onCheckedChange={() => handleToggleRepo(repo.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`repo-${repo.id}`} className="cursor-pointer">
                        <div className="font-medium text-foreground">{repo.full_name}</div>
                        {repo.description && (
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {repo.description}
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedRepoIds.length} {selectedRepoIds.length === 1 ? "repository" : "repositories"} selected
            </p>
            <Button onClick={() => setShowRepoModal(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {syncError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{syncError}</AlertDescription>
          </Alert>
        )}

        {storedToken && selectedRepoIds.length > 0 ? (
          <>
            {/* Metrics */}
            <DashboardMetrics
              totalRepos={selectedRepoIds.length}
              totalIssues={totalIssues}
              openIssues={openIssues}
              closedIssues={closedIssues}
            />

            {/* Progress Bar */}
            <ProgressBar percentage={progressPercentage} />

            {/* Filters and Table */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3">
                <FilterPanel
                  repositories={uniqueRepos}
                  labels={uniqueLabels}
                  selectedRepos={selectedRepos}
                  selectedLabels={selectedLabels}
                  selectedStatuses={selectedStatuses}
                  searchQuery={searchQuery}
                  onRepoChange={setSelectedRepos}
                  onLabelChange={setSelectedLabels}
                  onStatusChange={setSelectedStatuses}
                  onSearchChange={setSearchQuery}
                />
              </div>

              <div className="col-span-9">
                {isLoadingIssues ? (
                  <Card className="p-12">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading issues from {selectedRepoIds.length} {selectedRepoIds.length === 1 ? "repository" : "repositories"}...</p>
                    </div>
                  </Card>
                ) : (
                  <IssueTable issues={filteredIssues} />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="p-12 max-w-md text-center">
              <Github className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Repositories Selected</h2>
              <p className="text-muted-foreground mb-6">
                {storedToken 
                  ? "Select repositories to track from the 'Manage Repositories' button above."
                  : "Connect your GitHub account to get started."
                }
              </p>
              {storedToken && (
                <Button onClick={() => setShowRepoModal(true)}>
                  Select Repositories
                </Button>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}