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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Loader2, Github, Tag, Users, FileText, Bug } from "lucide-react";
import {
  createGitHubIssue,
  fetchRepositoryLabels,
  fetchRepositoryCollaborators,
} from "@/services/githubService";
import { useToast } from "@/hooks/use-toast";

interface CreateIssueDialogProps {
  repositories: string[];
  token: string;
  onIssueCreated?: () => void;
}

interface BugReportForm {
  testId: string;
  version: string;
  module: string;
  description: string;
  steps: string;
  expectedResults: string;
  actualResults: string;
  suggestedSolution: string;
  kanbanId: string;
}

const initialBugForm: BugReportForm = {
  testId: "",
  version: "",
  module: "",
  description: "",
  steps: "",
  expectedResults: "",
  actualResults: "",
  suggestedSolution: "",
  kanbanId: "",
};

export function CreateIssueDialog({
  repositories,
  token,
  onIssueCreated,
}: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [issueType, setIssueType] = useState<"simple" | "bug">("bug");
  
  // Simple issue fields
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  
  // Bug report fields
  const [bugForm, setBugForm] = useState<BugReportForm>(initialBugForm);
  
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<Array<{ name: string; color: string }>>([]);
  const [availableCollaborators, setAvailableCollaborators] = useState<Array<{ login: string; avatar_url: string }>>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const { toast } = useToast();

  // Load labels and collaborators when repo changes
  useEffect(() => {
    if (!selectedRepo || !token) {
      setAvailableLabels([]);
      setAvailableCollaborators([]);
      return;
    }

    const loadRepoMeta = async () => {
      setIsLoadingMeta(true);
      const [owner, repo] = selectedRepo.split("/");
      
      try {
        const [labels, collaborators] = await Promise.all([
          fetchRepositoryLabels(token, owner, repo),
          fetchRepositoryCollaborators(token, owner, repo),
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
  }, [selectedRepo, token]);

  // Auto-add "bug" label for bug reports
  useEffect(() => {
    if (issueType === "bug" && availableLabels.some(l => l.name.toLowerCase() === "bug")) {
      if (!selectedLabels.includes("bug")) {
        setSelectedLabels(prev => [...prev, "bug"]);
      }
    }
  }, [issueType, availableLabels]);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setBugForm(initialBugForm);
    setSelectedLabels([]);
    setSelectedAssignees([]);
    setSelectedRepo("");
  };

  const formatBugReportBody = (): string => {
    const sections = [];
    
    if (bugForm.testId) {
      sections.push(`## Test ID\n${bugForm.testId}`);
    }
    
    if (bugForm.version) {
      sections.push(`## Version\n${bugForm.version}`);
    }
    
    if (bugForm.module) {
      sections.push(`## Module\n${bugForm.module}`);
    }
    
    if (bugForm.description) {
      sections.push(`## Description\n${bugForm.description}`);
    }
    
    if (bugForm.steps) {
      sections.push(`## Steps to Reproduce\n${bugForm.steps}`);
    }
    
    if (bugForm.expectedResults) {
      sections.push(`## Expected Results\n${bugForm.expectedResults}`);
    }
    
    if (bugForm.actualResults) {
      sections.push(`## Actual Results\n${bugForm.actualResults}`);
    }
    
    if (bugForm.suggestedSolution) {
      sections.push(`## Suggested Solution\n${bugForm.suggestedSolution}`);
    }
    
    if (bugForm.kanbanId) {
      sections.push(`## Kanban Task ID\n${bugForm.kanbanId}`);
    }
    
    return sections.join("\n\n");
  };

  const getIssueTitle = (): string => {
    if (issueType === "simple") {
      return title.trim();
    }
    // For bug reports, create title from Test ID and Module
    const parts = [];
    if (bugForm.testId) parts.push(`[${bugForm.testId}]`);
    if (bugForm.module) parts.push(`[${bugForm.module}]`);
    if (bugForm.description) {
      const shortDesc = bugForm.description.split("\n")[0].substring(0, 80);
      parts.push(shortDesc);
    }
    return parts.join(" ") || "Bug Report";
  };

  const isFormValid = (): boolean => {
    if (!selectedRepo) return false;
    
    if (issueType === "simple") {
      return title.trim().length > 0;
    }
    
    // Bug report validation
    return (
      bugForm.testId.trim().length > 0 &&
      bugForm.module.trim().length > 0 &&
      bugForm.description.trim().length > 0 &&
      bugForm.steps.trim().length > 0 &&
      bugForm.expectedResults.trim().length > 0 &&
      bugForm.actualResults.trim().length > 0 &&
      bugForm.suggestedSolution.trim().length > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const [owner, repo] = selectedRepo.split("/");
    
    const issueTitle = getIssueTitle();
    const issueBody = issueType === "simple" ? body.trim() : formatBugReportBody();

    try {
      await createGitHubIssue(
        token,
        owner,
        repo,
        issueTitle,
        issueBody || undefined,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Failed to create issue",
        description: errorMessage,
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

  const updateBugForm = (field: keyof BugReportForm, value: string) => {
    setBugForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Issue</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Create New Issue
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Repository Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repository">Repository *</Label>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select repository" />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo} value={repo}>
                      {repo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Tabs value={issueType} onValueChange={(v) => setIssueType(v as "simple" | "bug")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bug" className="gap-2">
                    <Bug className="h-4 w-4" />
                    Bug Report
                  </TabsTrigger>
                  <TabsTrigger value="simple" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Simple
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {issueType === "simple" ? (
                <>
                  {/* Simple Issue Form */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Issue title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">Description</Label>
                    <Textarea
                      id="body"
                      placeholder="Describe the issue..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Bug Report Form */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testId">Test ID *</Label>
                      <Input
                        id="testId"
                        placeholder="ex. AB-001"
                        value={bugForm.testId}
                        onChange={(e) => updateBugForm("testId", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        placeholder="ex. 1.0.1"
                        value={bugForm.version}
                        onChange={(e) => updateBugForm("version", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="module">Module *</Label>
                      <Input
                        id="module"
                        placeholder="ex. Login Screen"
                        value={bugForm.module}
                        onChange={(e) => updateBugForm("module", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Give a short overview about this issue..."
                      value={bugForm.description}
                      onChange={(e) => updateBugForm("description", e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="steps">Steps to Reproduce *</Label>
                    <Textarea
                      id="steps"
                      placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                      value={bugForm.steps}
                      onChange={(e) => updateBugForm("steps", e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expectedResults">Expected Results *</Label>
                      <Textarea
                        id="expectedResults"
                        placeholder="What was expected to happen?"
                        value={bugForm.expectedResults}
                        onChange={(e) => updateBugForm("expectedResults", e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actualResults">Actual Results *</Label>
                      <Textarea
                        id="actualResults"
                        placeholder="What actually happened?"
                        value={bugForm.actualResults}
                        onChange={(e) => updateBugForm("actualResults", e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="suggestedSolution">Suggested Solution *</Label>
                    <Textarea
                      id="suggestedSolution"
                      placeholder="What is your suggestion to fix this?"
                      value={bugForm.suggestedSolution}
                      onChange={(e) => updateBugForm("suggestedSolution", e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kanbanId">Kanban Task ID</Label>
                    <Input
                      id="kanbanId"
                      placeholder="Enter Kanban task ID"
                      value={bugForm.kanbanId}
                      onChange={(e) => updateBugForm("kanbanId", e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Labels & Assignees */}
              {selectedRepo && (
                <div className="space-y-4 pt-4 border-t">
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
                            className="cursor-pointer transition-colors text-xs"
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
                            className={`flex items-center gap-2 px-2 py-1 rounded-full border cursor-pointer transition-colors text-sm ${
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
                            <span>{collab.login}</span>
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
              )}
            </div>
          </ScrollArea>

          {/* Selected summary */}
          {(selectedLabels.length > 0 || selectedAssignees.length > 0) && (
            <div className="text-sm text-muted-foreground border-t pt-3">
              {selectedLabels.length > 0 && (
                <span className="mr-4">
                  <strong>{selectedLabels.length}</strong> label{selectedLabels.length !== 1 ? "s" : ""}
                </span>
              )}
              {selectedAssignees.length > 0 && (
                <span>
                  <strong>{selectedAssignees.length}</strong> assignee{selectedAssignees.length !== 1 ? "s" : ""}
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
            <Button type="submit" disabled={isSubmitting || !isFormValid()}>
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