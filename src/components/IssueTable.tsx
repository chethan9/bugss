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
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
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
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  if (sortedIssues.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No issues found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-card/50">
            <TableHead className="w-[100px]">Issue</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-muted"
                onClick={() => handleSort("title")}
              >
                Title
                <SortIcon field="title" />
              </Button>
            </TableHead>
            <TableHead className="w-[150px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-muted"
                onClick={() => handleSort("status")}
              >
                Status
                <SortIcon field="status" />
              </Button>
            </TableHead>
            <TableHead className="w-[200px]">Repository</TableHead>
            <TableHead className="w-[200px]">Labels</TableHead>
            <TableHead className="w-[150px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-muted"
                onClick={() => handleSort("createdAt")}
              >
                Date
                <SortIcon field="createdAt" />
              </Button>
            </TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedIssues.map((issue) => (
            <TableRow
              key={issue.id}
              className="border-border hover:bg-muted/50 cursor-pointer"
              onClick={() => onIssueClick(issue)}
            >
              <TableCell className="font-medium">#{issue.number}</TableCell>
              <TableCell className="max-w-md">
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline hover:text-primary transition-colors block"
                  onClick={(e) => e.stopPropagation()}
                >
                  {issue.title}
                </a>
                {issue.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {issue.labels.map((label) => (
                      <Badge
                        key={label}
                        variant="secondary"
                        className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground"
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={issue.status === "open" ? "default" : "secondary"}
                  className={
                    issue.status === "open"
                      ? "bg-status-open hover:bg-status-open"
                      : "bg-muted hover:bg-muted"
                  }
                >
                  {issue.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {issue.repository}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {issue.labels.map((label, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-[11px] px-2 py-0.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-normal whitespace-nowrap"
                    >
                      {label}
                    </Badge>
                  ))}
                  {issue.labels.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No labels</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(issue.createdAt))} ago
              </TableCell>
              <TableCell>
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}