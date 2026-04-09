import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Calendar, User, MessageSquare, Tag } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface IssueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueNumber: number;
  repository: string;
  token: string;
}

interface IssueDetails {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  labels: Array<{
    name: string;
    color: string;
    description?: string;
  }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  comments: number;
}

interface Comment {
  id: number;
  body: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

export function IssueDetailsModal({
  isOpen,
  onClose,
  issueNumber,
  repository,
  token,
}: IssueDetailsModalProps) {
  const [issue, setIssue] = useState<IssueDetails | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && issueNumber && repository) {
      fetchIssueDetails();
    }
  }, [isOpen, issueNumber, repository]);

  const fetchIssueDetails = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [owner, repo] = repository.split("/");

      // Fetch issue details
      const issueResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!issueResponse.ok) {
        throw new Error("Failed to fetch issue details");
      }

      const issueData = await issueResponse.json();
      setIssue(issueData);

      // Fetch comments if any
      if (issueData.comments > 0) {
        const commentsResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load issue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <code className="text-sm font-mono text-muted-foreground">
                #{issueNumber}
              </code>
              {issue && (
                <Badge
                  variant={issue.state === "open" ? "default" : "secondary"}
                  className={
                    issue.state === "open"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }
                >
                  {issue.state}
                </Badge>
              )}
            </div>
            {issue && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-2"
              >
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : issue ? (
          <>
            <div className="space-y-6">
              {/* Title */}
              <h2 className="text-xl font-semibold leading-tight">
                {issue.title}
              </h2>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={issue.user.avatar_url} />
                    <AvatarFallback>{issue.user.login[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{issue.user.login}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    opened {formatDistanceToNow(new Date(issue.created_at))} ago
                  </span>
                </div>
                {issue.comments > 0 && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{issue.comments} comments</span>
                  </div>
                )}
              </div>

              {/* Labels */}
              {issue.labels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {issue.labels.map((label) => (
                    <Badge
                      key={label.name}
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `#${label.color}20`,
                        borderColor: `#${label.color}`,
                        color: `#${label.color}`,
                      }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Assignees */}
              {issue.assignees.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Assignees:</span>
                  <div className="flex -space-x-2">
                    {issue.assignees.map((assignee) => (
                      <Avatar key={assignee.login} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={assignee.avatar_url} />
                        <AvatarFallback>
                          {assignee.login[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Description</h3>
                {issue.body ? (
                  <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-primary prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {issue.body}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description provided.
                  </p>
                )}
              </div>

              {/* Comments */}
              {comments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments ({comments.length})
                    </h3>
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="border border-border rounded-lg p-4 space-y-3 bg-card"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.user.avatar_url} />
                            <AvatarFallback>
                              {comment.user.login[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {comment.user.login}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            commented {formatDistanceToNow(new Date(comment.created_at))} ago
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-primary prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {comment.body}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}