"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProgressBar } from "@/components/ProgressBar";
import { IssueTable } from "@/components/IssueTable";
import { FilterPanel } from "@/components/FilterPanel";
import { GitHubConnect } from "@/components/GitHubConnect";
import { RepositoryPicker } from "@/components/RepositoryPicker";
import { SyncStatus } from "@/components/SyncStatus";
import { mockIssues, calculateMetrics } from "@/lib/mockData";
import { Github, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGitHubConnection, getTrackedRepositories, getAllIssues } from "@/services/githubService";
import { useAutoSync } from "@/hooks/useAutoSync";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [realIssues, setRealIssues] = useState<any[]>([]);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  const [filters, setFilters] = useState({
    repositories: [] as string[],
    labels: [] as string[],
    statuses: [] as string[],
    search: "",
  });

  // Check GitHub connection on mount
  useEffect(() => {
    // Check if we just came back from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const githubToken = urlParams.get("github_token");
    
    if (githubToken) {
      // Clear token from URL to prevent refreshing causing issues
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Save token
      import("@/services/githubService").then(({ saveGitHubConnection }) => {
        saveGitHubConnection(githubToken)
          .then(() => {
            checkConnection();
          })
          .catch(err => {
            console.error("Failed to save OAuth token", err);
          });
      });
    } else {
      checkConnection();
    }
  }, []);

  async function checkConnection() {
    try {
      const connection = await getGitHubConnection();
      if (connection) {
        setIsConnected(true);
        setLastSyncTime(connection.last_sync_at ? new Date(connection.last_sync_at) : null);
        await loadData();
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  }

  async function loadData() {
    try {
      const [repos, issues] = await Promise.all([
        getTrackedRepositories(),
        getAllIssues()
      ]);
      setRepositories(repos);
      setRealIssues(issues);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  const handleConnectSuccess = async () => {
    setIsConnected(true);
    setShowConnectModal(false);
    await loadData();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await loadData();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync hook
  const { isAutoSyncing, nextSyncAt } = useAutoSync({
    enabled: autoSyncEnabled && isConnected,
    onSync: handleSync,
    intervalMs: 15 * 60 * 1000 // 15 minutes
  });

  // Use real issues if connected, otherwise mock data
  const issues = isConnected && realIssues.length > 0 ? realIssues : mockIssues;

  // Filter issues based on current filters
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
          open: "Open",
          closed: "Closed",
          in_progress: "In Progress",
        };
        const issueStatus = issue.state === "open" ? "Open" : "Closed";
        if (!filters.statuses.some((s) => statusMap[s] === issueStatus)) {
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

  // Extract unique repositories and labels for filters
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

  if (!isConnected) {
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

        <main className="container px-6 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Github className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-4 font-heading text-3xl font-bold">Connect Your GitHub Account</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Connect your GitHub account to start tracking issues across all your repositories.
              Get real-time insights, powerful filtering, and beautiful analytics.
            </p>
            <Button size="lg" onClick={() => setShowConnectModal(true)}>
              <Github className="mr-2 h-5 w-5" />
              Connect GitHub
            </Button>

            <GitHubConnect
              open={showConnectModal}
              onOpenChange={setShowConnectModal}
              onSuccess={handleConnectSuccess}
            />
          </div>
        </main>
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
          <SyncStatus
            lastSyncTime={lastSyncTime}
            isSyncing={isSyncing}
            onSync={handleSync}
            onManageRepos={() => setShowRepoPicker(true)}
            autoSyncEnabled={autoSyncEnabled}
            onAutoSyncToggle={setAutoSyncEnabled}
            nextSyncAt={nextSyncAt}
            isAutoSyncing={isAutoSyncing}
          />
        </div>
      </header>

      <main className="container px-6 py-8">
        <div className="mb-8">
          <h2 className="mb-6 font-heading text-2xl font-bold">Summary</h2>
          <DashboardMetrics
            totalRepos={availableRepositories.length}
            totalIssues={filteredIssues.length}
            open={metrics.statusCounts.open}
            inProgress={metrics.statusCounts.inProgress}
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
              { value: "in_progress", label: "In Progress", count: metrics.statusCounts.inProgress },
              { value: "closed", label: "Closed", count: metrics.statusCounts.closed }
            ]}
            selectedRepos={filters.repositories}
            selectedLabels={filters.labels}
            selectedStatuses={filters.statuses}
            searchQuery={filters.search}
            onRepoToggle={(repo) => setFilters(prev => ({
              ...prev,
              repositories: prev.repositories.includes(repo)
                ? prev.repositories.filter(r => r !== repo)
                : [...prev.repositories, repo]
            }))}
            onLabelToggle={(label) => setFilters(prev => ({
              ...prev,
              labels: prev.labels.includes(label)
                ? prev.labels.filter(l => l !== label)
                : [...prev.labels, label]
            }))}
            onStatusToggle={(status) => setFilters(prev => ({
              ...prev,
              statuses: prev.statuses.includes(status)
                ? prev.statuses.filter(s => s !== status)
                : [...prev.statuses, status]
            }))}
            onSearchChange={(search) => setFilters(prev => ({ ...prev, search }))}
            onClearFilters={() => setFilters({
              repositories: [],
              labels: [],
              statuses: [],
              search: ""
            })}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold">
                Issues ({filteredIssues.length})
              </h3>
            </div>
            <IssueTable issues={filteredIssues} />
          </div>
        </div>
      </main>

      <RepositoryPicker
        open={showRepoPicker}
        onOpenChange={setShowRepoPicker}
        onUpdateComplete={loadData}
      />
    </div>
  );
}