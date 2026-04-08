import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, MessageSquare, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IssueComment {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  created_at: string;
}

interface IssueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueNumber: number;
  repository: string;
  token: string;
}

export function IssueDetailsModal({
  isOpen,
  onClose,
  issueNumber,
  repository,
  token,
}: IssueDetailsModalProps) {
  const [issue, setIssue] = useState<any>(null);
  const [comments, setComments] = useState<IssueComment[]>([]);
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
      // Fetch issue details
      const issueResponse = await fetch(
        `https://api.github.com/repos/${repository}/issues/${issueNumber}`,
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
          `https://api.github.com/repos/${repository}/issues/${issueNumber}/comments`,
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!issue && !isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading issue details...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-destructive">
            {error}
          </div>
        ) : issue ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-start gap-3">
                <span className="text-2xl">#{issue.number}</span>
                <span className="flex-1 text-xl">{issue.title}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Issue Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <Badge
                  variant={issue.state === "open" ? "default" : "secondary"}
                  className={
                    issue.state === "open"
                      ? "bg-status-open hover:bg-status-open"
                      : "bg-muted hover:bg-muted"
                  }
                >
                  {issue.state}
                </Badge>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{issue.user?.login || "Unknown"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Opened {formatDistanceToNow(new Date(issue.created_at))} ago
                  </span>
                </div>

                {issue.assignees?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span>Assigned to:</span>
                    {issue.assignees.map((assignee: any) => (
                      <Avatar key={assignee.id} className="h-6 w-6">
                        <AvatarImage src={assignee.avatar_url} />
                        <AvatarFallback>{assignee.login[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
              </div>

              {/* Labels */}
              {issue.labels?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {issue.labels.map((label: any) => (
                    <Badge
                      key={label.id}
                      variant="outline"
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

              <Separator />

              {/* Issue Body */}
              <div>
                <h3 className="mb-3 text-lg font-semibold">Description</h3>
                {issue.body ? (
                  <Card className="p-4">
                    <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">
                      {issue.body}
                    </div>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description provided
                  </p>
                )}
              </div>

              {/* Comments Section */}
              {comments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <MessageSquare className="h-5 w-5" />
                      Comments ({comments.length})
                    </h3>
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <Card key={comment.id} className="p-4">
                          <div className="mb-3 flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.user.avatar_url} />
                              <AvatarFallback>
                                {comment.user.login[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{comment.user.login}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at))} ago
                              </div>
                            </div>
                          </div>
                          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">
                            {comment.body}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* View on GitHub Link */}
              <div className="pt-4">
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  View on GitHub
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}