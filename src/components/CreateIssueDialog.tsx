import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, Loader2, Github, Tag, Users } from "lucide-react";
import {
  createGitHubIssue,
  fetchRepositoryLabels,
  fetchRepositoryCollaborators,
} from "@/services/githubService";
import { useToast } from "@/hooks/use-toast";

interface Repository {
  full_name: string;
  name: string;
  owner: string;
}

interface CreateIssueDialogProps {
  repositories: Repository[];
  accessToken: string;
  onIssueCreated?: () => void;
}

export function CreateIssueDialog({
  repositories,
  accessToken,
  onIssueCreated,
}: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<Array<{ name: string; color: string }>>([]);
  const [availableCollaborators, setAvailableCollaborators] = useState<Array<{ login: string; avatar_url: string }>>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const { toast } = useToast();

  // Load labels and collaborators when repo changes
  useEffect(() => {
    if (!selectedRepo || !accessToken) {
      setAvailableLabels([]);
      setAvailableCollaborators([]);
      return;
    }

    const loadRepoMeta = async () => {
      setIsLoadingMeta(true);
      const [owner, repo] = selectedRepo.split("/");
      
      try {
        const [labels, collaborators] = await Promise.all([
          fetchRepositoryLabels(accessToken, owner, repo),
          fetchRepositoryCollaborators(accessToken, owner, repo),
        ]);
        setAvailableLabels(labels);
        setAvailableCollaborators(collaborators);
      } catch (error) {
        console.error("Failed to load repo metadata:", error);
      } finally {
        setIsLoadingMeta(false);
      }
    };

    loadRepoMeta();
  }, [selectedRepo, accessToken]);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setSelectedLabels([]);
    setSelectedAssignees([]);
    setSelectedRepo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRepo || !title.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please select a repository and enter a title",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const [owner, repo] = selectedRepo.split("/");

    try {
      await createGitHubIssue(
        accessToken,
        owner,
        repo,
        title.trim(),
        body.trim() || undefined,
        selectedLabels.length > 0 ? selectedLabels : undefined,
        selectedAssignees.length > 0 ? selectedAssignees : undefined
      );

      toast({
        title: "Issue created",
        description: `Successfully created issue in ${selectedRepo}`,
      });

      resetForm();
      setOpen(false);
      onIssueCreated?.();
    } catch (error: any) {
      toast({
        title: "Failed to create issue",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLabel = (labelName: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelName)
        ? prev.filter((l) => l !== labelName)
        : [...prev, labelName]
    );
  };

  const toggleAssignee = (login: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(login)
        ? prev.filter((a) => a !== login)
        : [...prev, login]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Issue</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Create New Issue
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Repository Selection */}
          <div className="space-y-2">
            <Label htmlFor="repository">Repository *</Label>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger>
                <SelectValue placeholder="Select a repository" />
              </SelectTrigger>
              <SelectContent>
                {repositories.map((repo) => (
                  <SelectItem key={repo.full_name} value={repo.full_name}>
                    {repo.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Description</Label>
            <Textarea
              id="body"
              placeholder="Describe the issue..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Labels & Assignees - only show when repo is selected */}
          {selectedRepo && (
            <ScrollArea className="flex-1 max-h-[200px]">
              <div className="space-y-4 pr-4">
                {/* Labels */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Labels
                    {isLoadingMeta && <Loader2 className="h-3 w-3 animate-spin" />}
                  </Label>
                  {availableLabels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableLabels.map((label) => (
                        <Badge
                          key={label.name}
                          variant={selectedLabels.includes(label.name) ? "default" : "outline"}
                          className="cursor-pointer transition-colors"
                          style={{
                            backgroundColor: selectedLabels.includes(label.name)
                              ? `#${label.color}`
                              : "transparent",
                            borderColor: `#${label.color}`,
                            color: selectedLabels.includes(label.name)
                              ? getContrastColor(label.color)
                              : `#${label.color}`,
                          }}
                          onClick={() => toggleLabel(label.name)}
                        >
                          {label.name}
                          {selectedLabels.includes(label.name) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No labels available</p>
                  )}
                </div>

                {/* Assignees */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assignees
                  </Label>
                  {availableCollaborators.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableCollaborators.map((collab) => (
                        <div
                          key={collab.login}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                            selectedAssignees.includes(collab.login)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted border-border"
                          }`}
                          onClick={() => toggleAssignee(collab.login)}
                        >
                          <img
                            src={collab.avatar_url}
                            alt={collab.login}
                            className="h-5 w-5 rounded-full"
                          />
                          <span className="text-sm">{collab.login}</span>
                          {selectedAssignees.includes(collab.login) && (
                            <X className="h-3 w-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No collaborators available</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Selected summary */}
          {(selectedLabels.length > 0 || selectedAssignees.length > 0) && (
            <div className="text-sm text-muted-foreground border-t pt-3">
              {selectedLabels.length > 0 && (
                <span className="mr-4">
                  <strong>{selectedLabels.length}</strong> label{selectedLabels.length !== 1 ? "s" : ""} selected
                </span>
              )}
              {selectedAssignees.length > 0 && (
                <span>
                  <strong>{selectedAssignees.length}</strong> assignee{selectedAssignees.length !== 1 ? "s" : ""} selected
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedRepo || !title.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Issue
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to determine text color based on background
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(0, 2), 16);
  const g = parseInt(hexColor.slice(2, 4), 16);
  const b = parseInt(hexColor.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}