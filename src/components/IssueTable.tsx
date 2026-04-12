import { useState, useMemo, useCallback, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ExternalLink, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Check
} from "lucide-react";

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
  headerRight?: React.ReactNode;
}

type SortField = "number" | "title" | "status" | "severity" | "assignee" | "repository" | "createdAt";
type SortDirection = "asc" | "desc";

// Helper functions
const getSeverityFromLabels = (labels: string[]): string => {
  const labelText = labels.join(" ").toLowerCase();
  if (labelText.includes("critical")) return "critical";
  if (labelText.includes("high")) return "high";
  if (labelText.includes("medium")) return "medium";
  if (labelText.includes("low")) return "low";
  return "none";
};

const getSeverityOrder = (severity: string): number => {
  switch (severity) {
    case "critical": return 0;
    case "high": return 1;
    case "medium": return 2;
    case "low": return 3;
    default: return 4;
  }
};

const getStatusOrder = (status: string): number => {
  switch (status) {
    case "open": return 0;
    case "in_progress": return 1;
    case "closed": return 2;
    default: return 3;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "in_progress":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "closed":
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30";
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
    case "high":
      return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30";
    case "medium":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
    case "low":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30";
  }
};

// Sortable Header Component
function SortableHeader({ 
  label, 
  field, 
  currentSort, 
  currentDirection, 
  onSort 
}: { 
  label: string; 
  field: SortField; 
  currentSort: SortField; 
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort === field;
  
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1.5 hover:text-foreground transition-colors group font-semibold"
    >
      {label}
      <span className={`transition-colors ${isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"}`}>
        {isActive ? (
          currentDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  );
}

// Filter Button Component
function FilterButton({
  label,
  value,
  options,
  onChange,
  counts,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  counts?: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const isFiltered = value !== "all";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs gap-1 ${isFiltered ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
        >
          <Filter className="h-3 w-3" />
          {isFiltered ? options.find(o => o.value === value)?.label : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="space-y-0.5">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
                value === option.value ? "bg-muted" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                {value === option.value && <Check className="h-3.5 w-3.5 text-primary" />}
                <span className={value === option.value ? "font-medium" : ""}>{option.label}</span>
              </span>
              {counts && counts[option.value] !== undefined && (
                <span className="text-xs text-muted-foreground">{counts[option.value]}</span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Memoized table row component for performance
const IssueRow = memo(function IssueRow({ 
  issue, 
  onIssueClick 
}: { 
  issue: Issue; 
  onIssueClick: (issue: Issue) => void;
}) {
  const severity = getSeverityFromLabels(issue.labels);
  
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onIssueClick(issue)}
    >
      <TableCell className="font-mono text-xs text-muted-foreground w-[70px]">
        #{issue.number}
      </TableCell>
      <TableCell>
        <p className="font-medium text-sm line-clamp-1">{issue.title}</p>
      </TableCell>
      <TableCell className="w-[100px]">
        <Badge
          variant="outline"
          className={`${getStatusColor(issue.status)} capitalize text-xs`}
        >
          {issue.status.replace("_", " ")}
        </Badge>
      </TableCell>
      <TableCell className="w-[100px]">
        {severity !== "none" && (
          <Badge
            variant="outline"
            className={`${getSeverityColor(severity)} capitalize text-xs`}
          >
            {severity}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-sm w-[140px]">
        {issue.assignee ? (
          <span className="text-foreground truncate block">{issue.assignee}</span>
        ) : (
          <span className="text-muted-foreground italic text-xs">Unassigned</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground w-[160px]">
        <span className="truncate block">{issue.repository.split("/").pop()}</span>
      </TableCell>
      <TableCell className="w-[50px]">
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </TableCell>
    </TableRow>
  );
});

export function IssueTable({ issues, onIssueClick, pageSize = 50, headerRight }: IssueTableProps) {
  const [titleSearch, setTitleSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("number");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Extract unique assignees - memoized
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set(issues.filter(i => i.assignee).map(i => i.assignee!));
    return Array.from(assignees).sort();
  }, [issues]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const statusCounts: Record<string, number> = { all: issues.length, open: 0, in_progress: 0, closed: 0 };
    const severityCounts: Record<string, number> = { all: issues.length, critical: 0, high: 0, medium: 0, low: 0, none: 0 };
    
    issues.forEach(issue => {
      statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
      const severity = getSeverityFromLabels(issue.labels);
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });
    
    return { statusCounts, severityCounts };
  }, [issues]);

  // Apply filters and sorting - memoized
  const filteredAndSortedIssues = useMemo(() => {
    const result = issues.filter(issue => {
      if (titleSearch && !issue.title.toLowerCase().includes(titleSearch.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && issue.status !== statusFilter) {
        return false;
      }
      if (severityFilter !== "all") {
        const severity = getSeverityFromLabels(issue.labels);
        if (severity !== severityFilter) return false;
      }
      if (assigneeFilter !== "all") {
        if (assigneeFilter === "unassigned" && issue.assignee) return false;
        if (assigneeFilter !== "unassigned" && issue.assignee !== assigneeFilter) return false;
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "number":
          comparison = a.number - b.number;
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          comparison = getStatusOrder(a.status) - getStatusOrder(b.status);
          break;
        case "severity":
          comparison = getSeverityOrder(getSeverityFromLabels(a.labels)) - getSeverityOrder(getSeverityFromLabels(b.labels));
          break;
        case "assignee":
          const assigneeA = a.assignee || "zzz";
          const assigneeB = b.assignee || "zzz";
          comparison = assigneeA.localeCompare(assigneeB);
          break;
        case "repository":
          comparison = a.repository.localeCompare(b.repository);
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [issues, titleSearch, statusFilter, severityFilter, assigneeFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedIssues.length / pageSize);
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedIssues.slice(start, start + pageSize);
  }, [filteredAndSortedIssues, currentPage, pageSize]);

  // Handlers
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  }, [sortField]);

  const handleFilterChange = useCallback((setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setTitleSearch("");
    setStatusFilter("all");
    setSeverityFilter("all");
    setAssigneeFilter("all");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = titleSearch || statusFilter !== "all" || severityFilter !== "all" || assigneeFilter !== "all";

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Filter options
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "closed", label: "Closed" },
  ];

  const severityOptions = [
    { value: "all", label: "All Severity" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const assigneeOptions = [
    { value: "all", label: "All Assignees" },
    { value: "unassigned", label: "Unassigned" },
    ...uniqueAssignees.map(a => ({ value: a, label: a })),
  ];

  return (
    <div className="space-y-3">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={titleSearch}
            onChange={(e) => handleFilterChange(setTitleSearch, e.target.value)}
            className="pl-9 h-9"
          />
          {titleSearch && (
            <button
              onClick={() => handleFilterChange(setTitleSearch, "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <FilterButton
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={(v) => handleFilterChange(setStatusFilter, v)}
            counts={filterCounts.statusCounts}
          />
          <FilterButton
            label="Severity"
            value={severityFilter}
            options={severityOptions}
            onChange={(v) => handleFilterChange(setSeverityFilter, v)}
            counts={filterCounts.severityCounts}
          />
          <FilterButton
            label="Assignee"
            value={assigneeFilter}
            options={assigneeOptions}
            onChange={(v) => handleFilterChange(setAssigneeFilter, v)}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}

        {/* Right side - custom content or default count */}
        <div className="ml-auto flex items-center gap-3">
          {headerRight || (
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedIssues.length} of {issues.length} issues
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="w-[70px]">
                <SortableHeader 
                  label="#" 
                  field="number" 
                  currentSort={sortField} 
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader 
                  label="Title" 
                  field="title" 
                  currentSort={sortField} 
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-[100px]">
                <SortableHeader 
                  label="Status" 
                  field="status" 
                  currentSort={sortField} 
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-[100px]">
                <SortableHeader 
                  label="Severity" 
                  field="severity" 
                  currentSort={sortField} 
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-[140px]">
                <SortableHeader 
                  label="Assignee" 
                  field="assignee" 
                  currentSort={sortField} 
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-[160px]">
                <SortableHeader 
                  label="Repository" 
                  field="repository" 
                  currentSort={sortField} 
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-[50px]">Link</TableHead>
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
              paginatedIssues.map((issue) => (
                <IssueRow 
                  key={issue.id} 
                  issue={issue} 
                  onIssueClick={onIssueClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 mx-2">
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
                    onClick={() => goToPage(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}