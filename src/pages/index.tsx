"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProgressBar } from "@/components/ProgressBar";
import { IssueTable } from "@/components/IssueTable";
import { FilterPanel } from "@/components/FilterPanel";
import { calculateMetrics } from "@/lib/mockData";
import { Github, LayoutDashboard, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Repository {
  owner: string;
  name: string;
  fullName: string;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{ name: string; color: string }>;
  repository: string;
  html_url: string;
  created_at: string;
}

export default function Home() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [repoInput, setRepoInput] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTokenDialog, setShowTokenDialog] = useState(false);

  const [filters, setFilters] = useState({
    repositories: [] as string[],
    labels: [] as string[],
    statuses: [] as string[],
    search: "",
  });

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("github_token");
    const savedRepos = localStorage.getItem("github_repos");
    
    if (savedToken) {
      setToken(savedToken);
      if (savedRepos) {
        setRepositories(JSON.parse(savedRepos));
      }
    } else {
      setShowTokenDialog(true);
    }
  }, []);

  // Fetch issues when repositories change
  useEffect(() => {
    if (token && repositories.length > 0) {
      fetchAllIssues();
    }
  }, [repositories, token]);

  const saveToken = () => {
    if (!tokenInput.trim()) {
      setError("Please enter a valid token");
      return;
    }
    localStorage.setItem("github_token", tokenInput.trim());
    setToken(tokenInput.trim());
    setTokenInput("");
    setShowTokenDialog(false);
    setError("");
  };

  const addRepository = async () => {
    if (!repoInput.trim()) return;
    
    // Parse repo URL or owner/name
    let owner = "";
    let name = "";
    
    if (repoInput.includes("github.com")) {
      const match = repoInput.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        owner = match[1];
        name = match[2].replace(/\.git$/, "");
      }
    } else if (repoInput.includes("/")) {
      [owner, name] = repoInput.split("/");
    }
    
    if (!owner || !name) {
      setError("Invalid repository format. Use 'owner/repo' or paste GitHub URL");
      return;
    }
    
    const fullName = `${owner}/${name}`;
    if (repositories.some(r => r.fullName === fullName)) {
      setError("Repository already added");
      return;
    }
    
    const newRepo = { owner, name, fullName };
    const updatedRepos = [...repositories, newRepo];
    setRepositories(updatedRepos);
    localStorage.setItem("github_repos", JSON.stringify(updatedRepos));
    setRepoInput("");
    setError("");
  };

  const removeRepository = (fullName: string) => {
    const updatedRepos = repositories.filter(r => r.fullName !== fullName);
    setRepositories(updatedRepos);
    localStorage.setItem("github_repos", JSON.stringify(updatedRepos));
    setIssues(prev => prev.filter(i => i.repository !== fullName));
  };

  const fetchAllIssues = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const allIssues: Issue[] = [];
      
      for (const repo of repositories) {
        const response = await fetch(
          `https://api.github.com/repos/${repo.fullName}/issues?state=all&per_page=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch issues from ${repo.fullName}`);
        }
        
        const repoIssues = await response.json();
        allIssues.push(
          ...repoIssues.map((issue: any) => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            labels: issue.labels || [],
            repository: repo.fullName,
            html_url: issue.html_url,
            created_at: issue.created_at,
          }))
        );
      }
      
      setIssues(allIssues);
    } catch (err: any) {
      setError(err.message || "Failed to fetch issues");
    } finally {
      setIsLoading(false);
    }
  };

  const resetToken = () => {
    localStorage.removeItem("github_token");
    localStorage.removeItem("github_repos");
    setToken("");
    setRepositories([]);
    setIssues([]);
    setShowTokenDialog(true);
  };

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (
        filters.repositories.length > 0 &&
        !filters.repositories.includes(issue.repository)
      ) {
        return false;
      }

      if (filters.statuses.length > 0) {
        const statusMap: Record<string, string> = {
          open: "open",
          closed: "closed",
        };
        if (!filters.statuses.includes(statusMap[issue.state])) {
          return false;
        }
      }

      if (filters.labels.length > 0) {
        const issueLabels = issue.labels?.map((l: any) => l.name || l) || [];
        if (!filters.labels.some((label) => issueLabels.includes(label))) {
          return false;
        }
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          issue.title.toLowerCase().includes(searchLower) ||
          issue.body?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [issues, filters]);

  const metrics = useMemo(() => calculateMetrics(filteredIssues), [filteredIssues]);

  const availableRepositories = useMemo(() => {
    return Array.from(new Set(issues.map((issue) => issue.repository)));
  }, [issues]);

  const availableLabels = useMemo(() => {
    const labels = new Set<string>();
    issues.forEach((issue) => {
      issue.labels?.forEach((label: any) => {
        labels.add(typeof label === "string" ? label : label.name);
      });
    });
    return Array.from(labels);
  }, [issues]);

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
                Enter your GitHub token to start tracking repository issues
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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
                  Create a token at{" "}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,read:user"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub Settings → Developer settings
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  Required scopes: <code className="rounded bg-muted px-1 py-0.5">repo</code>,{" "}
                  <code className="rounded bg-muted px-1 py-0.5">read:user</code>
                </p>
              </div>
              <Button onClick={saveToken} className="w-full">
                Save Token
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="font-heading text-xl font-bold">GitHub Issue Dashboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={resetToken}>
            <Settings className="mr-2 h-4 w-4" />
            Change Token
          </Button>
        </div>
      </header>

      <main className="container px-6 py-8">
        {repositories.length === 0 ? (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Github className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-4 font-heading text-3xl font-bold">Add Your First Repository</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Enter any GitHub repository to start tracking its issues
            </p>
            
            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Repository URL or Owner/Name</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="facebook/react or https://github.com/facebook/react"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addRepository()}
                    />
                    <Button onClick={addRepository}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {repositories.map((repo) => (
                      <Badge key={repo.fullName} variant="secondary" className="gap-2">
                        {repo.fullName}
                        <button
                          onClick={() => removeRepository(repo.fullName)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add repository..."
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addRepository()}
                      className="w-64"
                    />
                    <Button onClick={addRepository} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mb-8">
              <h2 className="mb-6 font-heading text-2xl font-bold">Summary</h2>
              <DashboardMetrics
                totalRepos={repositories.length}
                totalIssues={filteredIssues.length}
                open={metrics.statusCounts.open}
                inProgress={0}
                closed={metrics.statusCounts.closed}
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
                  {isLoading && <Badge variant="secondary">Loading...</Badge>}
                </div>
                <IssueTable issues={filteredIssues} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}