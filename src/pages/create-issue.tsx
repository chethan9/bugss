import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Github,
  Tag,
  Users,
  Bug,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  createGitHubIssue,
  fetchRepositoryLabels,
  fetchRepositoryCollaborators,
} from "@/services/githubService";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { Logo } from "@/components/Logo";

const STORAGE_KEYS = {
  GITHUB_TOKEN: "github_token",
  SELECTED_REPOS: "selected_repos",
};

interface FormData {
  testId: string;
  version: string;
  module: string;
  description: string;
  steps: string;
  expectedResults: string;
  actualResults: string;
  suggestedSolution: string;
  kanbanId: string;
  simpleTitle: string;
  simpleBody: string;
}

export default function CreateIssuePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [token, setToken] = useState("");
  const [repositories, setRepositories] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [issueType, setIssueType] = useState<"bug" | "simple">("bug");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<Array<{ name: string; color: string }>>([]);
  const [availableCollaborators, setAvailableCollaborators] = useState<Array<{ login: string; avatar_url: string }>>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    testId: "",
    version: "",
    module: "",
    description: "",
    steps: "",
    expectedResults: "",
    actualResults: "",
    suggestedSolution: "",
    kanbanId: "",
    simpleTitle: "",
    simpleBody: "",
  });

  // Load token and repos from URL params or storage
  useEffect(() => {
    // Check URL params first
    const urlRepos = router.query.repos as string;
    const urlToken = router.query.token as string;
    
    if (urlToken) {
      setToken(urlToken);
    } else {
      const savedToken = localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
      if (savedToken) {
        setToken(savedToken);
      }
    }
    
    if (urlRepos) {
      const repos = urlRepos.split(",").filter(Boolean);
      setRepositories(repos);
      if (repos.length === 1) {
        setSelectedRepo(repos[0]);
      }
    } else {
      const savedRepos = localStorage.getItem(STORAGE_KEYS.SELECTED_REPOS);
      if (savedRepos) {
        try {
          const repos = JSON.parse(savedRepos);
          setRepositories(repos);
          if (repos.length === 1) {
            setSelectedRepo(repos[0]);
          }
        } catch (e) {
          console.error("Failed to parse saved repos");
        }
      }
    }
  }, [router.query]);

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
        
        // Auto-select bug label for bug reports
        if (issueType === "bug") {
          const bugLabel = labels.find(l => l.name.toLowerCase() === "bug");
          if (bugLabel && !selectedLabels.includes(bugLabel.name)) {
            setSelectedLabels(prev => [...prev, bugLabel.name]);
          }
        }
      } catch (error) {
        console.error("Failed to load repo metadata:", error);
      } finally {
        setIsLoadingMeta(false);
      }
    };

    loadRepoMeta();
  }, [selectedRepo, token]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleLabel = (labelName: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelName)
        ? prev.filter(l => l !== labelName)
        : [...prev, labelName]
    );
  };

  const toggleAssignee = (login: string) => {
    setSelectedAssignees(prev =>
      prev.includes(login)
        ? prev.filter(a => a !== login)
        : [...prev, login]
    );
  };

  const buildIssueBody = (): string => {
    if (issueType === "simple") {
      return formData.simpleBody;
    }

    const sections = [
      `## Test ID\n${formData.testId}`,
      formData.version && `## Version\n${formData.version}`,
      `## Module\n${formData.module}`,
      `## Short Description\n${formData.description}`,
      `## Steps to Reproduce\n${formData.steps}`,
      `## Expected Results\n${formData.expectedResults}`,
      `## Actual Results\n${formData.actualResults}`,
      `## Suggested Solution\n${formData.suggestedSolution}`,
      formData.kanbanId && `## Kanban Task ID\n${formData.kanbanId}`,
    ].filter(Boolean);

    return sections.join("\n\n");
  };

  const buildIssueTitle = (): string => {
    if (issueType === "simple") {
      return formData.simpleTitle;
    }
    
    const parts = [
      formData.testId && `[${formData.testId}]`,
      formData.module && `[${formData.module}]`,
      formData.description.split("\n")[0].substring(0, 80),
    ].filter(Boolean);
    
    return parts.join(" ");
  };

  const isFormValid = (): boolean => {
    if (!selectedRepo) return false;
    
    if (issueType === "simple") {
      return formData.simpleTitle.trim().length > 0;
    }
    
    return (
      formData.testId.trim().length > 0 &&
      formData.module.trim().length > 0 &&
      formData.description.trim().length > 0 &&
      formData.steps.trim().length > 0 &&
      formData.expectedResults.trim().length > 0 &&
      formData.actualResults.trim().length > 0 &&
      formData.suggestedSolution.trim().length > 0
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

    try {
      const issue = await createGitHubIssue(
        token,
        owner,
        repo,
        buildIssueTitle(),
        buildIssueBody(),
        selectedLabels.length > 0 ? selectedLabels : undefined,
        selectedAssignees.length > 0 ? selectedAssignees : undefined
      );

      toast({
        title: "Issue created successfully!",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Issue #{issue.number} created in {selectedRepo}</span>
          </div>
        ),
      });

      // Navigate back to dashboard
      router.push("/");
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

  const getLabelColor = (color: string) => {
    return {
      backgroundColor: `#${color}20`,
      borderColor: `#${color}`,
      color: getContrastColor(color),
    };
  };

  if (!token || repositories.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle>Setup Required</CardTitle>
            <CardDescription>
              Please connect to GitHub and select repositories first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO title="Create Issue - FixFlix" description="Create a new GitHub issue" />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline text-sm">Back to Dashboard</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                <h1 className="font-semibold">Create New Issue</h1>
              </div>
            </div>
            <Logo />
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Repository & Issue Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Select the repository and type of issue you want to create
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Repository */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Repository <span className="text-destructive">*</span>
                    </Label>
                    <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select repository" />
                      </SelectTrigger>
                      <SelectContent>
                        {repositories.map((repo) => (
                          <SelectItem key={repo} value={repo}>
                            <div className="flex items-center gap-2">
                              <Github className="h-4 w-4" />
                              {repo}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isLoadingMeta && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading labels and collaborators...
                      </p>
                    )}
                  </div>

                  {/* Issue Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Issue Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={issueType === "bug" ? "default" : "outline"}
                        className="h-11 justify-start gap-2"
                        onClick={() => setIssueType("bug")}
                      >
                        <Bug className="h-4 w-4" />
                        Bug Report
                      </Button>
                      <Button
                        type="button"
                        variant={issueType === "simple" ? "default" : "outline"}
                        className="h-11 justify-start gap-2"
                        onClick={() => setIssueType("simple")}
                      >
                        <FileText className="h-4 w-4" />
                        Simple Issue
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bug Report Form */}
            {issueType === "bug" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bug className="h-5 w-5 text-red-500" />
                    Bug Report Details
                  </CardTitle>
                  <CardDescription>
                    Fill in the details about the bug you encountered
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Row 1: Test ID, Version, Module */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testId">
                        Test ID <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="testId"
                        placeholder="ex. AB-001"
                        value={formData.testId}
                        onChange={(e) => updateField("testId", e.target.value)}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Unique serial number
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        placeholder="ex. 1.0.1"
                        value={formData.version}
                        onChange={(e) => updateField("version", e.target.value)}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        App version (optional)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="module">
                        Module <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="module"
                        placeholder="ex. Login Screen"
                        value={formData.module}
                        onChange={(e) => updateField("module", e.target.value)}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Affected module/screen
                      </p>
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Short Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Give a short overview about this issue..."
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Steps to Reproduce */}
                  <div className="space-y-2">
                    <Label htmlFor="steps">
                      Steps to Reproduce <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="steps"
                      placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                      value={formData.steps}
                      onChange={(e) => updateField("steps", e.target.value)}
                      rows={4}
                      className="resize-none font-mono text-sm"
                    />
                  </div>

                  {/* Expected & Actual Results */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expectedResults">
                        Expected Results <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="expectedResults"
                        placeholder="What was expected to happen?"
                        value={formData.expectedResults}
                        onChange={(e) => updateField("expectedResults", e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actualResults">
                        Actual Results <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="actualResults"
                        placeholder="What actually happened?"
                        value={formData.actualResults}
                        onChange={(e) => updateField("actualResults", e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  {/* Suggested Solution */}
                  <div className="space-y-2">
                    <Label htmlFor="suggestedSolution">
                      Suggested Solution <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="suggestedSolution"
                      placeholder="What is your suggestion to fix this?"
                      value={formData.suggestedSolution}
                      onChange={(e) => updateField("suggestedSolution", e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Kanban ID */}
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="kanbanId">Kanban Task ID</Label>
                    <Input
                      id="kanbanId"
                      placeholder="ex. TASK-123"
                      value={formData.kanbanId}
                      onChange={(e) => updateField("kanbanId", e.target.value)}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Link to related Kanban task (optional)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Simple Issue Form */}
            {issueType === "simple" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Issue Details
                  </CardTitle>
                  <CardDescription>
                    Create a quick issue with title and description
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="simpleTitle">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="simpleTitle"
                      placeholder="Brief summary of the issue"
                      value={formData.simpleTitle}
                      onChange={(e) => updateField("simpleTitle", e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="simpleBody">Description</Label>
                    <Textarea
                      id="simpleBody"
                      placeholder="Add any additional details, context, or screenshots..."
                      value={formData.simpleBody}
                      onChange={(e) => updateField("simpleBody", e.target.value)}
                      rows={8}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports Markdown formatting
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Labels & Assignees */}
            {selectedRepo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5 text-purple-500" />
                    Labels & Assignees
                  </CardTitle>
                  <CardDescription>
                    Optionally add labels and assign team members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Labels */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Labels ({availableLabels.length} available)
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLabelPicker(!showLabelPicker)}
                      >
                        {showLabelPicker ? "Hide" : "Select Labels"}
                      </Button>
                    </div>
                    
                    {/* Selected Labels */}
                    {selectedLabels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedLabels.map((label) => {
                          const labelData = availableLabels.find(l => l.name === label);
                          return (
                            <Badge
                              key={label}
                              variant="outline"
                              className="cursor-pointer hover:opacity-80 transition-opacity gap-1 pr-1"
                              style={labelData ? getLabelColor(labelData.color) : undefined}
                              onClick={() => toggleLabel(label)}
                            >
                              {label}
                              <X className="h-3 w-3" />
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Label Picker - Show all labels */}
                    {showLabelPicker && availableLabels.length > 0 && (
                      <ScrollArea className="h-64 border rounded-md p-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {availableLabels.map((label) => (
                            <Badge
                              key={label.name}
                              variant={selectedLabels.includes(label.name) ? "default" : "outline"}
                              className="cursor-pointer hover:opacity-80 transition-opacity justify-between px-2 py-1.5"
                              style={getLabelColor(label.color)}
                              onClick={() => toggleLabel(label.name)}
                            >
                              <span className="truncate">{label.name}</span>
                              {selectedLabels.includes(label.name) && (
                                <CheckCircle2 className="h-3 w-3 ml-1 flex-shrink-0" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    
                    {showLabelPicker && availableLabels.length === 0 && !isLoadingMeta && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        No labels found in this repository
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Assignees */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Assignees
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAssigneePicker(!showAssigneePicker)}
                      >
                        {showAssigneePicker ? "Hide" : "Select Assignees"}
                      </Button>
                    </div>
                    
                    {/* Selected Assignees */}
                    {selectedAssignees.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedAssignees.map((login) => {
                          const user = availableCollaborators.find(c => c.login === login);
                          return (
                            <Badge
                              key={login}
                              variant="secondary"
                              className="cursor-pointer hover:opacity-80 transition-opacity gap-2 pr-1"
                              onClick={() => toggleAssignee(login)}
                            >
                              {user?.avatar_url && (
                                <img
                                  src={user.avatar_url}
                                  alt={login}
                                  className="w-4 h-4 rounded-full"
                                />
                              )}
                              {login}
                              <X className="h-3 w-3" />
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Assignee Picker */}
                    {showAssigneePicker && availableCollaborators.length > 0 && (
                      <ScrollArea className="h-32 border rounded-md p-2">
                        <div className="flex flex-wrap gap-2">
                          {availableCollaborators.map((user) => (
                            <Badge
                              key={user.login}
                              variant={selectedAssignees.includes(user.login) ? "default" : "outline"}
                              className="cursor-pointer hover:opacity-80 transition-opacity gap-2"
                              onClick={() => toggleAssignee(user.login)}
                            >
                              {selectedAssignees.includes(user.login) && (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              <img
                                src={user.avatar_url}
                                alt={user.login}
                                className="w-4 h-4 rounded-full"
                              />
                              {user.login}
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    
                    {showAssigneePicker && availableCollaborators.length === 0 && !isLoadingMeta && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        No collaborators found or you don&apos;t have permission to view them
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4">
              <Link href="/" className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Cancel
                </Button>
              </Link>
              
              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid()}
                className="w-full sm:w-auto gap-2 min-w-[160px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Issue
                  </>
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}

// Helper function to get contrast color for label
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(0, 2), 16);
  const g = parseInt(hexColor.slice(2, 4), 16);
  const b = parseInt(hexColor.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}