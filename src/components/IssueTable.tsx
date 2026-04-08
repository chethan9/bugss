import { Badge } from "@/components/ui/badge";
import { ExternalLink, GitBranch, Tag } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
}

const statusConfig = {
  open: { label: "Open", variant: "open" as const },
  in_progress: { label: "In Progress", variant: "progress" as const },
  closed: { label: "Closed", variant: "closed" as const }
};

export function IssueTable({ issues }: IssueTableProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="w-32 font-semibold">Issue Key</TableHead>
            <TableHead className="font-semibold">Summary</TableHead>
            <TableHead className="w-40 font-semibold">Status</TableHead>
            <TableHead className="w-48 font-semibold">Repository</TableHead>
            <TableHead className="w-48 font-semibold">Labels</TableHead>
            <TableHead className="w-32 font-semibold">Assignee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id} className="hover:bg-muted/50 border-border">
              <TableCell className="font-mono text-sm">
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  #{issue.number}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </TableCell>
              <TableCell className="max-w-md">
                <div className="truncate" title={issue.title}>
                  {issue.title}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusConfig[issue.status].variant}>
                  {statusConfig[issue.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GitBranch className="w-4 h-4" />
                  {issue.repository}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {issue.labels.slice(0, 3).map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {label}
                    </Badge>
                  ))}
                  {issue.labels.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{issue.labels.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {issue.assignee || "Unassigned"}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}