"use client";

import { useState, useMemo } from "react";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProgressBar } from "@/components/ProgressBar";
import { IssueTable } from "@/components/IssueTable";
import { FilterPanel } from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { RefreshCw, Github } from "lucide-react";
import { mockIssues, getUniqueRepositories, getUniqueLabels, calculateMetrics } from "@/lib/mockData";

export default function Home() {
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const repositories = useMemo(() => getUniqueRepositories(mockIssues), []);
  const labels = useMemo(() => getUniqueLabels(mockIssues), []);

  const filteredIssues = useMemo(() => {
    return mockIssues.filter(issue => {
      if (selectedRepos.length > 0 && !selectedRepos.includes(issue.repository)) {
        return false;
      }
      if (selectedLabels.length > 0 && !issue.labels.some(label => selectedLabels.includes(label))) {
        return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(issue.status)) {
        return false;
      }
      if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [selectedRepos, selectedLabels, selectedStatuses, searchQuery]);

  const metrics = useMemo(() => calculateMetrics(filteredIssues), [filteredIssues]);

  const statusOptions = [
    { value: "open", label: "Open", count: mockIssues.filter(i => i.status === "open").length },
    { value: "in_progress", label: "In Progress", count: mockIssues.filter(i => i.status === "in_progress").length },
    { value: "closed", label: "Closed", count: mockIssues.filter(i => i.status === "closed").length }
  ];

  const handleRepoToggle = (repo: string) => {
    setSelectedRepos(prev =>
      prev.includes(repo) ? prev.filter(r => r !== repo) : [...prev, repo]
    );
  };

  const handleLabelToggle = (label: string) => {
    setSelectedLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleClearFilters = () => {
    setSelectedRepos([]);
    setSelectedLabels([]);
    setSelectedStatuses([]);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">GitHub Issue Dashboard</h1>
              <p className="text-sm text-muted-foreground">Track and manage issues across repositories</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Repositories
          </Button>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          <FilterPanel
            repositories={repositories}
            labels={labels}
            statuses={statusOptions}
            selectedRepos={selectedRepos}
            selectedLabels={selectedLabels}
            selectedStatuses={selectedStatuses}
            searchQuery={searchQuery}
            onRepoToggle={handleRepoToggle}
            onLabelToggle={handleLabelToggle}
            onStatusToggle={handleStatusToggle}
            onSearchChange={setSearchQuery}
            onClearFilters={handleClearFilters}
          />

          <div className="flex-1 space-y-6">
            <DashboardMetrics
              totalRepos={repositories.length}
              totalIssues={filteredIssues.length}
              open={metrics.statusCounts.open}
              inProgress={metrics.statusCounts.inProgress}
              closed={metrics.statusCounts.closed}
            />

            <ProgressBar
              segments={metrics.segments}
              completionRate={metrics.completionRate}
            />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Issues ({filteredIssues.length})
              </h2>
            </div>

            <IssueTable issues={filteredIssues} />
          </div>
        </div>
      </main>
    </div>
  );
}