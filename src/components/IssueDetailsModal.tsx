import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  title: string;
  body: string;
  state: string;
  labels: Array<{ name: string; color: string }>;
  user: {
    login: string;
    avatar_url: string;
  };
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  created_at: string;
  updated_at: string;
  html_url: string;
  comments_count: number;
}

interface Comment {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  created_at: string;
  html_url: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchIssueDetails = async () => {
      setLoading(true);
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

        // Fetch comments if there are any
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load issue");
      } finally {
        setLoading(false);
      }
    };

    fetchIssueDetails();
  }, [isOpen, issueNumber, repository, token]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold mb-2 pr-8">
                {loading ? (
                  <div className="h-6 bg-muted animate-pulse rounded" />
                ) : (
                  issue?.title
                )}
              </DialogTitle>
              {!loading && issue && (
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-mono text-muted-foreground">
                    #{issueNumber}
                  </code>
                  <Badge
                    className={`
                      px-2.5 py-1 text-xs font-medium rounded-full
                      ${issue.state === "open"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-purple-100 text-purple-700 border border-purple-200"
                      }
                    `}
                  >
                    {issue.state === "open" ? "Open" : "Closed"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    opened {formatDistanceToNow(new Date(issue.created_at))} ago by {issue.user.login}
                  </span>
                </div>
              )}
            </div>
            {!loading && issue && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="shrink-0"
              >
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{error}</p>
          </div>
        ) : issue ? (
          <>
            {/* Labels */}
            {issue.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-4 border-b border-border">
                {issue.labels.map((label) => (
                  <Badge
                    key={label.name}
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                      borderColor: `#${label.color}40`,
                    }}
                    className="px-2 py-1 text-xs border"
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={issue.user.avatar_url} alt={issue.user.login} />
                  <AvatarFallback>{issue.user.login[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{issue.user.login}</span>
                    <span className="text-xs text-muted-foreground">
                      commented {formatDistanceToNow(new Date(issue.created_at))} ago
                    </span>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    {issue.body ? (
                      <div className="prose-github">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            img: ({ node, ...props }) => (
                              <img
                                {...props}
                                className="max-w-full h-auto rounded-lg border border-border my-4"
                                loading="lazy"
                              />
                            ),
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                className="text-primary hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                            code: ({ node, className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(className || "");
                              return match ? (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              ) : (
                                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            pre: ({ node, ...props }) => (
                              <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-3" {...props} />
                            ),
                            h1: ({ node, ...props }) => (
                              <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-border" {...props} />
                            ),
                            h2: ({ node, ...props }) => (
                              <h2 className="text-xl font-semibold mt-5 mb-3 pb-2 border-b border-border" {...props} />
                            ),
                            h3: ({ node, ...props }) => (
                              <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                              <p className="my-3 leading-relaxed" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul className="my-3 ml-6 list-disc" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol className="my-3 ml-6 list-decimal" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                              <li className="my-1" {...props} />
                            ),
                            blockquote: ({ node, ...props }) => (
                              <blockquote className="border-l-4 border-border pl-4 my-3 italic text-muted-foreground" {...props} />
                            ),
                            table: ({ node, ...props }) => (
                              <table className="w-full border-collapse my-4" {...props} />
                            ),
                            th: ({ node, ...props }) => (
                              <th className="border border-border px-3 py-2 text-left bg-muted font-semibold" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                              <td className="border border-border px-3 py-2 text-left" {...props} />
                            ),
                          }}
                        >
                          {issue.body}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No description provided.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assignees */}
              {issue.assignees.length > 0 && (
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <span className="text-sm font-medium text-muted-foreground">Assignees:</span>
                  <div className="flex items-center gap-2">
                    {issue.assignees.map((assignee) => (
                      <div key={assignee.login} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={assignee.avatar_url} alt={assignee.login} />
                          <AvatarFallback>{assignee.login[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{assignee.login}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {comments.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold">
                    Comments ({comments.length})
                  </h3>
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={comment.user.avatar_url} alt={comment.user.login} />
                        <AvatarFallback>{comment.user.login[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">{comment.user.login}</span>
                          <span className="text-xs text-muted-foreground">
                            commented {formatDistanceToNow(new Date(comment.created_at))} ago
                          </span>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 border border-border">
                          <div className="prose-github">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                img: ({ node, ...props }) => (
                                  <img
                                    {...props}
                                    className="max-w-full h-auto rounded-lg border border-border my-4"
                                    loading="lazy"
                                  />
                                ),
                                a: ({ node, ...props }) => (
                                  <a
                                    {...props}
                                    className="text-primary hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  />
                                ),
                                code: ({ node, className, children, ...props }: any) => {
                                  const match = /language-(\w+)/.exec(className || "");
                                  return match ? (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                pre: ({ node, ...props }) => (
                                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-3" {...props} />
                                ),
                                h1: ({ node, ...props }) => (
                                  <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-border" {...props} />
                                ),
                                h2: ({ node, ...props }) => (
                                  <h2 className="text-xl font-semibold mt-5 mb-3 pb-2 border-b border-border" {...props} />
                                ),
                                h3: ({ node, ...props }) => (
                                  <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
                                ),
                                p: ({ node, ...props }) => (
                                  <p className="my-3 leading-relaxed" {...props} />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul className="my-3 ml-6 list-disc" {...props} />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol className="my-3 ml-6 list-decimal" {...props} />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className="my-1" {...props} />
                                ),
                                blockquote: ({ node, ...props }) => (
                                  <blockquote className="border-l-4 border-border pl-4 my-3 italic text-muted-foreground" {...props} />
                                ),
                                table: ({ node, ...props }) => (
                                  <table className="w-full border-collapse my-4" {...props} />
                                ),
                                th: ({ node, ...props }) => (
                                  <th className="border border-border px-3 py-2 text-left bg-muted font-semibold" {...props} />
                                ),
                                td: ({ node, ...props }) => (
                                  <td className="border border-border px-3 py-2 text-left" {...props} />
                                ),
                              }}
                            >
                              {comment.body}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}