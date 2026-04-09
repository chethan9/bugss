import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

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

interface IssueTableProps {
  issues: GitHubIssue[];
  onIssueClick: (issue: GitHubIssue) => void;
}

type SortField = "createdAt" | "title" | "status";
type SortDirection = "asc" | "desc" | null;

export function IssueTable({ issues, onIssueClick }: IssueTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleCopyId = (e: React.MouseEvent, issueNumber: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(issueNumber));
    setCopiedId(String(issueNumber));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sortedIssues = [...issues];
  if (sortField && sortDirection) {
    sortedIssues.sort((a, b) => {
      let compareResult = 0;

      if (sortField === "createdAt") {
        compareResult = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === "title") {
        compareResult = a.title.localeCompare(b.title);
      } else if (sortField === "status") {
        compareResult = a.status.localeCompare(b.status);
      }

      return sortDirection === "asc" ? compareResult : -compareResult;
    });
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/40" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />
    );
  };

  if (sortedIssues.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">No issues found matching your filters</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 border-b border-border z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] font-medium text-foreground sticky left-0 bg-muted/50">
                  Issue
                </TableHead>
                <TableHead className="font-medium text-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 -ml-2 hover:bg-muted font-medium text-foreground"
                    onClick={() => handleSort("title")}
                  >
                    Title
                    <SortIcon field="title" />
                  </Button>
                </TableHead>
                <TableHead className="w-[120px] text-center font-medium text-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 hover:bg-muted font-medium text-foreground"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    <SortIcon field="status" />
                  </Button>
                </TableHead>
                <TableHead className="w-[200px] font-medium text-foreground">Repository</TableHead>
                <TableHead className="w-[140px] text-right font-medium text-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 hover:bg-muted font-medium text-foreground"
                    onClick={() => handleSort("createdAt")}
                  >
                    Date
                    <SortIcon field="createdAt" />
                  </Button>
                </TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIssues.map((issue, index) => (
                <TableRow
                  key={issue.id}
                  className={`
                    cursor-pointer transition-smooth active-scale
                    ${index % 2 === 0 ? "bg-card" : "bg-muted/30"}
                    hover:bg-blue-50/50 border-b border-border/50
                  `}
                  onClick={() => onIssueClick(issue)}
                >
                  <TableCell className="font-mono text-sm sticky left-0 bg-inherit group">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{issue.number}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => handleCopyId(e, issue.number)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                          >
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {copiedId === String(issue.number) ? "Copied!" : "Copy ID"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md py-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <a
                            href={issue.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:text-primary transition-colors block truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {issue.title}
                          </a>
                          {issue.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {issue.labels.slice(0, 3).map((label) => (
                                <Badge
                                  key={label}
                                  variant="secondary"
                                  className="text-[11px] px-2 py-0 bg-gray-100 text-gray-700 border-0 font-normal"
                                >
                                  {label}
                                </Badge>
                              ))}
                              {issue.labels.length > 3 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[11px] px-2 py-0 bg-gray-100 text-gray-600 border-0 font-normal"
                                >
                                  +{issue.labels.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="font-medium">{issue.title}</p>
                        {issue.labels.length > 3 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            All labels: {issue.labels.join(", ")}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={issue.status === "open" ? "default" : "secondary"}
                      className={`
                        text-xs font-medium px-3 py-1 rounded-full
                        ${issue.status === "open" 
                          ? "bg-green-100 text-green-700 hover:bg-green-100" 
                          : issue.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                        }
                      `}
                    >
                      {issue.status === "in_progress" ? "In Progress" : issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {issue.repository.split("/")[1] || issue.repository}
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground cursor-default">
                          {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(issue.createdAt).toLocaleString()}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center">
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded group-hover:opacity-60"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}