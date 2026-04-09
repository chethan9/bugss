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
import { Copy, ExternalLink, ArrowUp, ArrowDown } from "lucide-react";

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

  const sortedIssues = [...issues].sort((a, b) => {
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

  const handleCopyId = (e: React.MouseEvent, issueNumber: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`#${issueNumber}`);
    setCopiedId(`#${issueNumber}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent border-b-2 border-border">
              <TableHead className="sticky left-0 z-20 bg-muted/80 backdrop-blur-sm w-[100px] font-semibold">
                Issue ID
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/60 transition-colors font-semibold"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-2">
                  Title
                  {sortField === "title" && (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/60 transition-colors text-center font-semibold"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center justify-center gap-2">
                  Status
                  {sortField === "status" && (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead className="font-semibold">Repository</TableHead>
              <TableHead className="font-semibold">Labels</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/60 transition-colors text-right font-semibold"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center justify-end gap-2">
                  Created
                  {sortField === "createdAt" && (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIssues.map((issue, idx) => (
              <TableRow
                key={issue.id}
                onClick={() => onIssueClick(issue)}
                className={`
                  cursor-pointer transition-smooth active-scale
                  hover:bg-blue-50/50
                  ${idx % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
                `}
              >
                <TableCell className="sticky left-0 z-10 bg-inherit">
                  <div className="flex items-center gap-2 group">
                    <code className="text-xs font-mono font-medium text-primary">
                      #{issue.number}
                    </code>
                    <button
                      onClick={(e) => handleCopyId(e, issue.number)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy issue ID"
                    >
                      <Copy className="h-3 w-3 text-muted-foreground hover:text-primary" />
                    </button>
                    {copiedId === `#${issue.number}` && (
                      <span className="text-[10px] text-green-600">Copied!</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium line-clamp-2 leading-snug">
                      {issue.title}
                    </p>
                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {issue.labels.slice(0, 3).map((label, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-[10px] px-1.5 py-0 h-5 bg-gray-100 text-gray-700 font-normal"
                          >
                            {label}
                          </Badge>
                        ))}
                        {issue.labels.length > 3 && (
                          <Badge 
                            variant="secondary" 
                            className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary font-medium"
                          >
                            +{issue.labels.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={`
                      px-2.5 py-1 text-xs font-medium rounded-full
                      ${issue.status === "open" 
                        ? "bg-green-100 text-green-700 border border-green-200" 
                        : issue.status === "in_progress"
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                      }
                    `}
                  >
                    {issue.status === "open" ? "Open" : issue.status === "in_progress" ? "In Progress" : "Closed"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {issue.repository.split("/")[1] || issue.repository}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {issue.labels.length} label{issue.labels.length !== 1 ? "s" : ""}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground text-right">
                  {formatDistanceToNow(new Date(issue.createdAt))} ago
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}