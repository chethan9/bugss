import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

export interface GitHubIssue {
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

interface Issue {
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

interface IssueTableProps {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  pageSize?: number;
}

// Helper function - defined before useMemo that uses it
const getSeverityFromLabels = (labels: string[]): string => {
  const labelText = labels.join(" ").toLowerCase();
  if (labelText.includes("critical")) return "critical";
  if (labelText.includes("high")) return "high";
  if (labelText.includes("medium")) return "medium";
  if (labelText.includes("low")) return "low";
  return "none";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "in_progress":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
    case "closed":
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "high":
      return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
    case "medium":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "low":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
  }
};

export function IssueTable({ issues, onIssueClick, pageSize = 50 }: IssueTableProps) {
  const [titleSearch, setTitleSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique values for filters
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set(issues.filter(i => i.assignee).map(i => i.assignee!));
    return Array.from(assignees).sort();
  }, [issues]);

  // Apply filters with useCallback for better performance
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Title search
      if (titleSearch && !issue.title.toLowerCase().includes(titleSearch.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && issue.status !== statusFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== "all") {
        const severity = getSeverityFromLabels(issue.labels);
        if (severity !== severityFilter) return false;
      }

      // Assignee filter
      if (assigneeFilter !== "all") {
        if (assigneeFilter === "unassigned" && issue.assignee) return false;
        if (assigneeFilter !== "unassigned" && issue.assignee !== assigneeFilter) return false;
      }

      return true;
    });
  }, [issues, titleSearch, statusFilter, severityFilter, assigneeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredIssues.length / pageSize);
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIssues.slice(start, start + pageSize);
  }, [filteredIssues, currentPage, pageSize]);

  // Reset page when filters change
  const handleFilterChange = useCallback((setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  }, []);

  const clearAllFilters = () => {
    setTitleSearch("");
    setStatusFilter("all");
    setSeverityFilter("all");
    setAssigneeFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = titleSearch || statusFilter !== "all" || severityFilter !== "all" || assigneeFilter !== "all";

  return (
    <div className="space-y-3">
      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-md">
          <p className="text-sm text-muted-foreground">
            Showing {filteredIssues.length} of {issues.length} issues
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all filters
          </Button>
        </div>
      )}

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px]">#</TableHead>
              <TableHead className="min-w-[300px]">
                <div className="space-y-2">
                  <span className="font-semibold">Title</span>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Search titles..."
                      value={titleSearch}
                      onChange={(e) => handleFilterChange(setTitleSearch, e.target.value)}
                      className="h-8 pl-7 text-xs"
                    />
                    {titleSearch && (
                      <button
                        onClick={() => handleFilterChange(setTitleSearch, "")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[140px]">
                <div className="space-y-2">
                  <span className="font-semibold">Status</span>
                  <Select value={statusFilter} onValueChange={(v) => handleFilterChange(setStatusFilter, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>
              <TableHead className="w-[140px]">
                <div className="space-y-2">
                  <span className="font-semibold">Severity</span>
                  <Select value={severityFilter} onValueChange={(v) => handleFilterChange(setSeverityFilter, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>
              <TableHead className="w-[160px]">
                <div className="space-y-2">
                  <span className="font-semibold">Assignee</span>
                  <Select value={assigneeFilter} onValueChange={(v) => handleFilterChange(setAssigneeFilter, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {uniqueAssignees.map(assignee => (
                        <SelectItem key={assignee} value={assignee}>
                          {assignee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>
              <TableHead className="w-[200px]">Repository</TableHead>
              <TableHead className="w-[80px]">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedIssues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  {hasActiveFilters ? "No issues match your filters" : "No issues found"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedIssues.map((issue) => {
                const severity = getSeverityFromLabels(issue.labels);
                return (
                  <TableRow
                    key={issue.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onIssueClick(issue)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{issue.number}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm line-clamp-1">{issue.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(issue.status)} capitalize`}
                      >
                        {issue.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {severity !== "none" && (
                        <Badge
                          variant="outline"
                          className={`${getSeverityColor(severity)} capitalize`}
                        >
                          {severity}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {issue.assignee ? (
                        <span className="text-foreground">{issue.assignee}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {issue.repository}
                    </TableCell>
                    <TableCell>
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({filteredIssues.length} issues)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
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
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}