import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Download,
  Trash2,
  Clock,
  FileDown,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  HardDrive,
  Settings,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { SmartInsights } from "@/components/analytics/SmartInsights";
import { BugSeverityHeatmap } from "@/components/analytics/BugSeverityHeatmap";
import { AverageResolutionTime } from "@/components/analytics/AverageResolutionTime";
import { IssueTrendChart } from "@/components/analytics/IssueTrendChart";
import { ModuleStabilityScore } from "@/components/analytics/ModuleStabilityScore";
import { ReopenedIssuesTracker } from "@/components/analytics/ReopenedIssuesTracker";
import { BugCategoryBreakdown } from "@/components/analytics/BugCategoryBreakdown";
import { BugHotspots } from "@/components/analytics/BugHotspots";
import { AtRiskRelease } from "@/components/analytics/AtRiskRelease";
import { AgingIssues } from "@/components/analytics/AgingIssues";
import { CriticalUntouched } from "@/components/analytics/CriticalUntouched";
import { BacklogGrowth } from "@/components/analytics/BacklogGrowth";
import { BugFixEfficiency } from "@/components/analytics/BugFixEfficiency";
import { RepeatBugDetector } from "@/components/analytics/RepeatBugDetector";
import { DeveloperLoad } from "@/components/analytics/DeveloperLoad";
import { FocusRecommendations } from "@/components/analytics/FocusRecommendations";
import { BugHeatmap } from "@/components/analytics/BugHeatmap";
import { ResolutionHistogram } from "@/components/analytics/ResolutionHistogram";
import { PriorityScatterPlot } from "@/components/analytics/PriorityScatterPlot";
import { StackedAreaChart } from "@/components/analytics/StackedAreaChart";
import { IssueFunnelChart } from "@/components/analytics/IssueFunnelChart";
import { BacklogWaterfallChart } from "@/components/analytics/BacklogWaterfallChart";
import { ModuleTreemap } from "@/components/analytics/ModuleTreemap";
import { ModuleRadarChart } from "@/components/analytics/ModuleRadarChart";
import { BulletChart } from "@/components/analytics/BulletChart";
import { RepositoryFilter } from "@/components/analytics/RepositoryFilter";
import { ProjectHealthGauge } from "@/components/analytics/ProjectHealthGauge";
import { BurndownChart } from "@/components/analytics/BurndownChart";
import { FlowEfficiency } from "@/components/analytics/FlowEfficiency";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProgressBar } from "@/components/ProgressBar";
import type { GitHubIssue } from "@/components/IssueTable";
import {
  generateSmartInsights,
  calculateSeverityDistribution,
  calculateAverageResolutionTime,
  calculateIssueTrend,
  calculateModuleStability,
  calculateReopenedIssues,
  calculateCategoryBreakdown,
  calculateBugHotspots,
  calculateAtRiskRelease,
  calculateAgingIssues,
  calculateCriticalUntouched,
  calculateBacklogGrowth,
  calculateBugFixEfficiency,
  detectRepeatBugs,
  calculateDeveloperLoad,
  generateFocusRecommendations,
  calculateBugHeatmap,
  calculateResolutionHistogram,
  calculatePriorityResolutionScatter,
  calculateStackedAreaData,
  calculateIssueFunnel,
  calculateBacklogWaterfall,
  calculateModuleTreemap,
  calculateModuleRadarData,
  calculateKPIMetrics,
} from "@/services/analyticsService";

interface Report {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  status: "generating" | "completed" | "failed";
  settings: Record<string, unknown>;
  created_at: string;
}

interface WidgetConfig {
  id: string;
  name: string;
  enabled: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "repositoryFilter", name: "Repository Filter", enabled: true },
  { id: "smartInsights", name: "Smart Insights", enabled: true },
  { id: "summaryMetrics", name: "Summary Metrics", enabled: true },
  { id: "progressBar", name: "Progress Bar", enabled: true },
  { id: "issuesTable", name: "Issues Table", enabled: true },
  { id: "projectHealth", name: "Project Health Gauge", enabled: true },
  { id: "burndownChart", name: "Sprint Burndown", enabled: true },
  { id: "flowEfficiency", name: "Flow Efficiency", enabled: true },
  { id: "issueTrend", name: "Issue Trend Chart", enabled: true },
  { id: "bugCategory", name: "Bug Category Breakdown", enabled: true },
  { id: "severityHeatmap", name: "Bug Severity Heatmap", enabled: true },
  { id: "resolutionTime", name: "Average Resolution Time", enabled: true },
  { id: "moduleStability", name: "Module Stability Score", enabled: true },
  { id: "reopenedTracker", name: "Reopened Issues Tracker", enabled: true },
  { id: "bugHotspots", name: "Bug Hotspots", enabled: true },
  { id: "atRiskRelease", name: "At-Risk Release", enabled: true },
  { id: "agingIssues", name: "Aging Issues", enabled: true },
  { id: "criticalUntouched", name: "Critical Untouched", enabled: true },
  { id: "backlogGrowth", name: "Backlog Growth", enabled: true },
  { id: "bugFixEfficiency", name: "Bug Fix Efficiency", enabled: true },
  { id: "repeatBugDetector", name: "Repeat Bug Detector", enabled: true },
  { id: "developerLoad", name: "Developer Load", enabled: true },
  { id: "focusRecommendations", name: "Focus Recommendations", enabled: true },
  { id: "bugHeatmap", name: "Bug Heatmap", enabled: true },
  { id: "resolutionHistogram", name: "Resolution Histogram", enabled: true },
  { id: "priorityScatter", name: "Priority Scatter Plot", enabled: true },
  { id: "stackedArea", name: "Stacked Area Chart", enabled: true },
  { id: "issueFunnel", name: "Issue Funnel Chart", enabled: true },
  { id: "backlogWaterfall", name: "Backlog Waterfall", enabled: true },
  { id: "moduleTreemap", name: "Module Treemap", enabled: true },
  { id: "moduleRadar", name: "Module Radar Chart", enabled: true },
  { id: "bulletChart", name: "Bullet Chart", enabled: true },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  
  // Report settings
  const [reportName, setReportName] = useState("FixFlix Report");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [appName, setAppName] = useState("FixFlix");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Data for widgets
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  
  // Available repositories
  const [availableRepos, setAvailableRepos] = useState<Array<{ id: string; name: string; full_name: string }>>([]);
  const [reposForReport, setReposForReport] = useState<string[]>([]);
  const [manualRepoInput, setManualRepoInput] = useState("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [allGitHubRepos, setAllGitHubRepos] = useState<Array<{ id: string; name: string; full_name: string }>>([]);
  const [showRepoDialog, setShowRepoDialog] = useState(false);

  // Calculate analytics data for widgets
  const analytics = useMemo(() => {
    return {
      insights: generateSmartInsights(issues),
      severities: calculateSeverityDistribution(issues),
      resolutionTime: calculateAverageResolutionTime(issues),
      trend: calculateIssueTrend(issues, 30),
      stability: calculateModuleStability(issues),
      reopened: calculateReopenedIssues(issues),
      categories: calculateCategoryBreakdown(issues),
      hotspots: calculateBugHotspots(issues, 5),
      atRiskRelease: calculateAtRiskRelease(issues),
      agingIssues: calculateAgingIssues(issues),
      criticalUntouched: calculateCriticalUntouched(issues, 3),
      backlogGrowth: calculateBacklogGrowth(issues),
      bugFixEfficiency: calculateBugFixEfficiency(issues, 30),
      repeatBugs: detectRepeatBugs(issues, 7),
      developerLoad: calculateDeveloperLoad(issues),
      focusRecommendations: generateFocusRecommendations(issues),
      bugHeatmap: calculateBugHeatmap(issues, 30),
      resolutionHistogram: calculateResolutionHistogram(issues),
      priorityScatter: calculatePriorityResolutionScatter(issues),
      stackedAreaData: calculateStackedAreaData(issues, 30),
      issueFunnel: calculateIssueFunnel(issues),
      backlogWaterfall: calculateBacklogWaterfall(issues, 4),
      moduleTreemap: calculateModuleTreemap(issues),
      moduleRadar: calculateModuleRadarData(issues, 5),
      kpiMetrics: calculateKPIMetrics(issues),
    };
  }, [issues]);

  const metrics = useMemo(() => {
    const statusCounts = { open: 0, inProgress: 0, closed: 0 };
    issues.forEach((issue) => {
      if (issue.status === "open") statusCounts.open++;
      else if (issue.status === "in_progress") statusCounts.inProgress++;
      else if (issue.status === "closed") statusCounts.closed++;
    });
    return { statusCounts };
  }, [issues]);

  // Check auth and load reports
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      setUser(session.user);
      loadReports(session.user.id);
      loadSettings(session.user.id);
      loadAvailableRepositories(session.user.id);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const loadReports = async (userId: string) => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error loading reports:", error);
      return;
    }
    
    // Cast the data to Report type with proper status typing
    const typedReports: Report[] = (data || []).map(row => ({
      ...row,
      status: row.status as "generating" | "completed" | "failed",
      settings: row.settings as Record<string, unknown>,
    }));
    
    setReports(typedReports);
  };

  const loadSettings = async (userId: string) => {
    const { data } = await supabase
      .from("user_settings")
      .select("app_name, logo_url")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (data) {
      if (data.app_name) setAppName(data.app_name);
      if (data.logo_url) setLogoUrl(data.logo_url);
    }
  };

  const loadAvailableRepositories = async (userId: string) => {
    try {
      console.log("📚 Loading repositories from GitHub...");
      
      // Get GitHub token from connection
      const { data: connection } = await supabase
        .from("github_connections")
        .select("id, access_token")
        .eq("user_id", userId)
        .maybeSingle();

      if (!connection || !connection.access_token) {
        console.warn("No GitHub connection or token found");
        return;
      }

      // Fetch repos directly from GitHub API
      const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        console.error("GitHub API error:", response.status);
        return;
      }

      const repos = await response.json();
      console.log(`✅ Fetched ${repos.length} repos from GitHub`);

      const repoList = repos.map((r: any) => ({
        id: r.id.toString(),
        name: r.name,
        full_name: r.full_name,
      }));

      setAvailableRepos(repoList);
      // Auto-select first 5 or all if less
      setReposForReport(repoList.slice(0, 5).map((r: any) => r.id));
    } catch (error) {
      console.error("Error loading repos from GitHub:", error);
    }
  };

  const fetchIssuesFromSupabase = async (): Promise<{ issues: GitHubIssue[]; repos: string[] }> => {
    try {
      console.log("🔍 Fetching issues from GitHub...");
      
      if (reposForReport.length === 0) {
        console.warn("❌ No repositories selected");
        return { issues: [], repos: [] };
      }

      // Get GitHub token from user_settings
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { issues: [], repos: [] };

      const { data: settings } = await supabase
        .from("user_settings")
        .select("github_token")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!settings?.github_token) {
        console.error("No GitHub token found");
        return { issues: [], repos: [] };
      }

      // Use the repo IDs directly (they are full_name format now)
      const selectedRepoNames = reposForReport;

      console.log("Fetching issues for repos:", selectedRepoNames);

      // Fetch issues directly from GitHub for each selected repo
      const allIssues: GitHubIssue[] = [];
      
      for (const repoFullName of selectedRepoNames) {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${repoFullName}/issues?state=all&per_page=100`,
            {
              headers: {
                Authorization: `Bearer ${settings.github_token}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          if (response.ok) {
            const issues = await response.json();
            // Filter out pull requests
            const actualIssues = issues.filter((i: any) => !i.pull_request);
            
            const transformed = actualIssues.map((issue: any) => ({
              id: issue.id.toString(),
              number: issue.number,
              title: issue.title,
              body: issue.body || "",
              status: issue.state === "closed" ? "closed" : "open",
              labels: (issue.labels || []).map((l: any) => l.name),
              assignees: issue.assignees || [],
              created_at: issue.created_at,
              updated_at: issue.updated_at,
              closed_at: issue.closed_at,
              repository: repoFullName,
              html_url: issue.html_url,
              createdAt: issue.created_at,
              url: issue.html_url,
            }));

            allIssues.push(...transformed);
            console.log(`✅ ${repoFullName}: ${transformed.length} issues`);
          }
        } catch (err) {
          console.error(`Failed to fetch issues for ${repoFullName}:`, err);
        }
      }

      // Update state for hidden widget container
      setIssues(allIssues);
      setSelectedRepos(selectedRepoNames);
      
      console.log(`✅ Total: ${allIssues.length} issues from ${selectedRepoNames.length} repos`);
      return { issues: allIssues, repos: selectedRepoNames };
    } catch (error) {
      console.error("❌ Error fetching issues:", error);
      return { issues: [], repos: [] };
    }
  };

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const enableAllWidgets = () => {
    setWidgets(prev => prev.map(w => ({ ...w, enabled: true })));
  };

  const disableAllWidgets = () => {
    setWidgets(prev => prev.map(w => ({ ...w, enabled: false })));
  };

  const generateReport = async () => {
    if (reposForReport.length === 0) {
      toast({ title: "No repositories selected", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(5);
    setGenerationStatus("Initializing...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      setGenerationProgress(10);
      setGenerationStatus("Fetching issues...");

      const { issues: fetchedIssues, repos: fetchedRepos } = await fetchIssuesFromSupabase();
      
      if (fetchedIssues.length === 0) {
        toast({ title: "No issues found", variant: "destructive" });
        setIsGenerating(false);
        return;
      }

      // Update state for widget rendering
      setIssues(fetchedIssues);
      setSelectedRepos(fetchedRepos);

      const currentEnabledWidgets = widgets.filter(w => w.enabled);

      setGenerationProgress(15);
      setGenerationStatus("Creating report record...");

      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          name: reportName,
          file_path: "",
          settings: {
            repos: reposForReport,
            widgets: currentEnabledWidgets.map(w => w.id),
            includeHeader,
            includeSummary,
          },
          status: "generating",
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Wait for widgets to render
      await new Promise(r => setTimeout(r, 1500));

      setGenerationProgress(20);
      setGenerationStatus("Creating PDF...");

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;

      // Header
      if (includeHeader) {
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text(reportName || "Analytics Report", margin, margin + 6);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100);
        pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 25, margin + 6);
        pdf.text(`${fetchedIssues.length} issues • ${fetchedRepos.length} repos`, margin, margin + 12);
        pdf.setTextColor(0);
        pdf.setDrawColor(200);
        pdf.line(margin, margin + 16, pageWidth - margin, margin + 16);
      }

      setGenerationProgress(25);
      setGenerationStatus("Capturing widgets...");

      // Capture widgets
      const widgetElements = document.querySelectorAll("[data-widget-id]");
      const captures: { canvas: HTMLCanvasElement; width: number; height: number }[] = [];

      let idx = 0;
      for (const el of Array.from(widgetElements)) {
        const widgetId = el.getAttribute("data-widget-id");
        if (!widgetId || !currentEnabledWidgets.find(w => w.id === widgetId)) continue;

        try {
          const canvas = await html2canvas(el as HTMLElement, {
            scale: 1.2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
          });
          captures.push({ canvas, width: canvas.width, height: canvas.height });
        } catch (e) {
          console.error(`Failed: ${widgetId}`, e);
        }

        idx++;
        setGenerationProgress(25 + Math.floor((idx / currentEnabledWidgets.length) * 50));
        setGenerationStatus(`Capturing ${idx}/${currentEnabledWidgets.length}...`);
      }

      if (captures.length === 0) throw new Error("No widgets captured");

      setGenerationProgress(80);
      setGenerationStatus("Building PDF layout...");

      // 2-column grid layout with larger widgets
      const cols = 2;
      const gap = 6;
      const cellWidth = (contentWidth - gap * (cols - 1)) / cols;
      const maxCellHeight = 70;
      const startY = includeHeader ? margin + 22 : margin;

      let x = margin;
      let y = startY;
      let rowHeight = 0;

      for (const cap of captures) {
        const aspect = cap.width / cap.height;
        let w = cellWidth;
        let h = w / aspect;
        if (h > maxCellHeight) {
          h = maxCellHeight;
          w = h * aspect;
          if (w > cellWidth) w = cellWidth;
        }

        // New row check
        if (x + w > pageWidth - margin + 1) {
          x = margin;
          y += rowHeight + gap;
          rowHeight = 0;
        }

        // New page check
        if (y + h > pageHeight - margin) {
          pdf.addPage();
          x = margin;
          y = margin;
          rowHeight = 0;
        }

        // Add as compressed JPEG (slightly higher quality)
        const imgData = cap.canvas.toDataURL("image/jpeg", 0.75);
        pdf.addImage(imgData, "JPEG", x, y, w, h);

        rowHeight = Math.max(rowHeight, h);
        x += w + gap;
      }

      setGenerationProgress(90);
      setGenerationStatus("Saving...");

      const pdfBlob = pdf.output("blob");
      const fileName = `${reportName.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`;

      // Download
      pdf.save(fileName);

      // Try cloud save (non-blocking)
      supabase.storage.from("reports").upload(`${user.id}/${fileName}`, pdfBlob, { contentType: "application/pdf" }).catch(() => {});

      await supabase.from("reports").update({
        file_path: `${user.id}/${fileName}`,
        file_size: pdfBlob.size,
        status: "completed",
      }).eq("id", reportData.id);

      setGenerationProgress(100);
      setGenerationStatus("Done!");

      toast({
        title: "Report generated!",
        description: `${(pdfBlob.size / 1024 / 1024).toFixed(1)} MB downloaded`,
      });

      loadReports(user.id);

    } catch (error) {
      console.error("Report error:", error);
      toast({ title: "Failed", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
        setGenerationStatus("");
      }, 1500);
    }
  };

  const downloadReport = async (report: Report) => {
    try {
      const { data, error } = await supabase.storage
        .from("reports")
        .download(report.file_path);

      if (error) {
        toast({
          title: "Download failed",
          description: "Could not download the report. It may have been deleted.",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.name + ".pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const deleteReport = async (report: Report) => {
    try {
      // Delete from storage
      await supabase.storage
        .from("reports")
        .remove([report.file_path]);

      // Delete from database
      await supabase
        .from("reports")
        .delete()
        .eq("id", report.id);

      toast({
        title: "Report deleted",
        description: "The report has been removed.",
      });

      loadReports(user.id);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const fetchGitHubRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Session check:", { session, sessionError });
      
      if (!session) {
        toast({ title: "Not authenticated", description: "Please log in again.", variant: "destructive" });
        return;
      }

      console.log("User ID:", session.user.id);

      // Get token from user_settings table (not github_connections)
      const { data: settings, error: settingsError } = await supabase
        .from("user_settings")
        .select("github_token")
        .eq("user_id", session.user.id)
        .maybeSingle();

      console.log("Settings query:", { settings, settingsError });

      if (!settings?.github_token) {
        toast({ title: "No GitHub token found", description: "Please connect GitHub on the dashboard.", variant: "destructive" });
        return;
      }

      console.log("Token found, fetching repos...");

      const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: {
          Authorization: `Bearer ${settings.github_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        console.error("GitHub API error:", response.status, await response.text());
        toast({ title: "Failed to fetch repos", description: `GitHub API error: ${response.status}`, variant: "destructive" });
        return;
      }

      const repos = await response.json();
      console.log(`Fetched ${repos.length} repos from GitHub`);
      
      const repoList = repos.map((r: any) => ({
        id: r.full_name,
        name: r.name,
        full_name: r.full_name,
      }));

      setAllGitHubRepos(repoList);
      setShowRepoDialog(true);
    } catch (error) {
      console.error("Error fetching repos:", error);
      toast({ title: "Error fetching repos", variant: "destructive" });
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const addSelectedRepo = (repo: { id: string; name: string; full_name: string }) => {
    if (!availableRepos.find(r => r.full_name === repo.full_name)) {
      setAvailableRepos(prev => [...prev, repo]);
    }
    if (!reposForReport.includes(repo.full_name)) {
      setReposForReport(prev => [...prev, repo.full_name]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const enabledCount = widgets.filter(w => w.enabled).length;

  return (
    <>
      <Head>
        <title>Reports - FixFlix</title>
      </Head>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Logo size="md" />
                <span className="font-semibold">{appName}</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reports
              </h1>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </header>

        <main className="container py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Report Generation */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Generate New Report
                  </CardTitle>
                  <CardDescription>
                    Configure and generate a PDF report of your analytics dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Report Name */}
                  <div className="space-y-2">
                    <Label htmlFor="reportName">Report Name</Label>
                    <Input
                      id="reportName"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Enter report name"
                    />
                  </div>

                  {/* Repository Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">
                        Repositories ({reposForReport.length} selected)
                      </Label>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={fetchGitHubRepos}
                        disabled={isLoadingRepos}
                        className="gap-2"
                      >
                        {isLoadingRepos ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Load Repos
                      </Button>
                    </div>
                    
                    {/* Selected repos list */}
                    {reposForReport.length > 0 ? (
                      <ScrollArea className="h-48 border rounded-lg p-3">
                        <div className="space-y-2">
                          {reposForReport.map((repoId) => {
                            const repo = availableRepos.find(r => r.id === repoId || r.full_name === repoId);
                            const displayName = repo?.full_name || repoId;
                            return (
                              <div
                                key={repoId}
                                className="p-3 rounded-lg border bg-primary/10 border-primary flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium truncate">{displayName}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                                  onClick={() => {
                                    setReposForReport(prev => prev.filter(id => id !== repoId));
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg">
                        <p className="text-sm">Click "Load Repos" to select repositories</p>
                      </div>
                    )}
                  </div>

                  {/* Repo Selection Dialog */}
                  <AlertDialog open={showRepoDialog} onOpenChange={setShowRepoDialog}>
                    <AlertDialogContent className="max-w-2xl max-h-[80vh]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Select Repositories</AlertDialogTitle>
                        <AlertDialogDescription>
                          Click on repositories to add them to your report ({allGitHubRepos.length} available)
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <ScrollArea className="h-96 pr-4">
                        <div className="space-y-2">
                          {allGitHubRepos.map((repo) => {
                            const isSelected = reposForReport.includes(repo.full_name);
                            return (
                              <div
                                key={repo.full_name}
                                onClick={() => {
                                  if (isSelected) {
                                    setReposForReport(prev => prev.filter(id => id !== repo.full_name));
                                  } else {
                                    addSelectedRepo(repo);
                                  }
                                }}
                                className={`
                                  p-3 rounded-lg border cursor-pointer transition-all
                                  ${isSelected
                                    ? "bg-primary/10 border-primary" 
                                    : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                                  }
                                `}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`
                                    w-4 h-4 rounded border-2 flex items-center justify-center
                                    ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}
                                  `}>
                                    {isSelected && (
                                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium">{repo.full_name}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                        <AlertDialogAction onClick={() => setShowRepoDialog(false)}>
                          Done ({reposForReport.length} selected)
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Separator />

                  {/* Options */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="includeHeader"
                        checked={includeHeader}
                        onCheckedChange={setIncludeHeader}
                      />
                      <Label htmlFor="includeHeader">Include Header</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="includeSummary"
                        checked={includeSummary}
                        onCheckedChange={setIncludeSummary}
                      />
                      <Label htmlFor="includeSummary">Include Summary</Label>
                    </div>
                  </div>

                  <Separator />

                  {/* Widget Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">
                        Widgets to Include ({enabledCount}/{widgets.length})
                      </Label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={enableAllWidgets}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={disableAllWidgets}>
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    
                    <ScrollArea className="h-64 border rounded-lg p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {widgets.map((widget) => (
                          <div
                            key={widget.id}
                            onClick={() => toggleWidget(widget.id)}
                            className={`
                              p-3 rounded-lg border cursor-pointer transition-all
                              ${widget.enabled 
                                ? "bg-primary/10 border-primary" 
                                : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                              }
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`
                                w-4 h-4 rounded border-2 flex items-center justify-center
                                ${widget.enabled ? "bg-primary border-primary" : "border-muted-foreground/30"}
                              `}>
                                {widget.enabled && (
                                  <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                )}
                              </div>
                              <span className="text-sm truncate">{widget.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <Separator />

                  {/* Generation Progress */}
                  {isGenerating && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Generating Report...</span>
                        <span className="text-sm text-muted-foreground">{generationProgress}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">{generationStatus}</p>
                    </div>
                  )}

                  {/* Generate Button */}
                  <Button
                    onClick={generateReport}
                    disabled={isGenerating || enabledCount === 0 || reposForReport.length === 0}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileDown className="h-4 w-4" />
                        Generate Report ({reposForReport.length} {reposForReport.length === 1 ? "repo" : "repos"})
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: Report History */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Report History
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadReports(user.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Previously generated reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No reports generated yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {report.status === "completed" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : report.status === "generating" ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              <span className="font-medium text-sm truncate">
                                {report.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(report.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {formatFileSize(report.file_size)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {report.status === "completed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadReport(report)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{report.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteReport(report)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{reports.length}</div>
                      <div className="text-xs text-muted-foreground">Total Reports</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {formatFileSize(reports.reduce((sum, r) => sum + r.file_size, 0))}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Size</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Hidden container for PDF widget capture - only render when generating */}
        {isGenerating && issues.length > 0 && (
          <div 
            id="pdf-widget-container" 
            style={{ 
              position: 'fixed', 
              left: '-9999px', 
              top: 0, 
              width: '1200px',
              backgroundColor: '#fff',
              padding: '20px'
            }}
          >
            <div className="space-y-6">
              {widgets.find(w => w.id === "repositoryFilter" && w.enabled) && (
                <div data-widget-id="repositoryFilter">
                  <RepositoryFilter 
                    repositories={selectedRepos}
                    activeRepositories={selectedRepos}
                    onToggle={() => {}}
                    issueCounts={issues.reduce((acc, issue) => {
                      acc[issue.repository] = (acc[issue.repository] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)}
                  />
                </div>
              )}
              
              {widgets.find(w => w.id === "smartInsights" && w.enabled) && (
                <div data-widget-id="smartInsights">
                  <SmartInsights insights={analytics.insights} />
                </div>
              )}
              
              {widgets.find(w => w.id === "summaryMetrics" && w.enabled) && (
                <div data-widget-id="summaryMetrics">
                  <DashboardMetrics 
                    totalRepos={selectedRepos.length}
                    totalIssues={issues.length}
                    openIssues={metrics.statusCounts.open}
                    closedIssues={metrics.statusCounts.closed}
                    isLoading={false}
                  />
                </div>
              )}
              
              {widgets.find(w => w.id === "progressBar" && w.enabled) && (
                <div data-widget-id="progressBar">
                  <ProgressBar 
                    open={metrics.statusCounts.open}
                    inProgress={metrics.statusCounts.inProgress || 0}
                    closed={metrics.statusCounts.closed}
                    total={issues.length}
                    isLoading={false}
                  />
                </div>
              )}
              
              {widgets.find(w => w.id === "issuesTable" && w.enabled) && (
                <div data-widget-id="issuesTable" style={{ width: "1100px" }}>
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Issues Overview</h3>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">#</th>
                          <th className="text-left p-2 font-medium">Title</th>
                          <th className="text-left p-2 font-medium">Status</th>
                          <th className="text-left p-2 font-medium">Repository</th>
                          <th className="text-left p-2 font-medium">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issues.slice(0, 50).map((issue, idx) => (
                          <tr key={issue.id} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                            <td className="p-2">#{issue.number}</td>
                            <td className="p-2 max-w-[400px] truncate">{issue.title}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                issue.status === "open" ? "bg-green-100 text-green-700" :
                                issue.status === "closed" ? "bg-gray-100 text-gray-700" :
                                "bg-purple-100 text-purple-700"
                              }`}>
                                {issue.status}
                              </span>
                            </td>
                            <td className="p-2 text-muted-foreground">{issue.repository?.split("/")[1] || issue.repository}</td>
                            <td className="p-2 text-muted-foreground">{new Date(issue.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {issues.length > 50 && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Showing 50 of {issues.length} issues
                      </p>
                    )}
                  </Card>
                </div>
              )}
              
              {widgets.find(w => w.id === "projectHealth" && w.enabled) && (
                <div data-widget-id="projectHealth">
                  <ProjectHealthGauge issues={issues} isLoading={false} />
                </div>
              )}
              
              {widgets.find(w => w.id === "burndownChart" && w.enabled) && (
                <div data-widget-id="burndownChart">
                  <BurndownChart issues={issues} />
                </div>
              )}
              
              {widgets.find(w => w.id === "flowEfficiency" && w.enabled) && (
                <div data-widget-id="flowEfficiency">
                  <FlowEfficiency issues={issues} />
                </div>
              )}
              
              {widgets.find(w => w.id === "issueTrend" && w.enabled) && (
                <div data-widget-id="issueTrend">
                  <IssueTrendChart data={analytics.trend} days={30} />
                </div>
              )}
              
              {widgets.find(w => w.id === "bugCategory" && w.enabled) && (
                <div data-widget-id="bugCategory">
                  <BugCategoryBreakdown categories={analytics.categories} />
                </div>
              )}
              
              {widgets.find(w => w.id === "severityHeatmap" && w.enabled) && (
                <div data-widget-id="severityHeatmap">
                  <BugSeverityHeatmap severities={analytics.severities} />
                </div>
              )}
              
              {widgets.find(w => w.id === "resolutionTime" && w.enabled) && (
                <div data-widget-id="resolutionTime">
                  <AverageResolutionTime stats={analytics.resolutionTime} />
                </div>
              )}
              
              {widgets.find(w => w.id === "moduleStability" && w.enabled) && (
                <div data-widget-id="moduleStability">
                  <ModuleStabilityScore stability={analytics.stability} />
                </div>
              )}
              
              {widgets.find(w => w.id === "reopenedTracker" && w.enabled) && (
                <div data-widget-id="reopenedTracker">
                  <ReopenedIssuesTracker stats={analytics.reopened} />
                </div>
              )}
              
              {widgets.find(w => w.id === "bugHotspots" && w.enabled) && (
                <div data-widget-id="bugHotspots">
                  <BugHotspots hotspots={analytics.hotspots} />
                </div>
              )}
              
              {widgets.find(w => w.id === "atRiskRelease" && w.enabled) && (
                <div data-widget-id="atRiskRelease">
                  <AtRiskRelease stats={analytics.atRiskRelease} />
                </div>
              )}
              
              {widgets.find(w => w.id === "agingIssues" && w.enabled) && (
                <div data-widget-id="agingIssues">
                  <AgingIssues stats={analytics.agingIssues} />
                </div>
              )}
              
              {widgets.find(w => w.id === "criticalUntouched" && w.enabled) && (
                <div data-widget-id="criticalUntouched">
                  <CriticalUntouched stats={analytics.criticalUntouched} />
                </div>
              )}
              
              {widgets.find(w => w.id === "backlogGrowth" && w.enabled) && (
                <div data-widget-id="backlogGrowth">
                  <BacklogGrowth stats={analytics.backlogGrowth} />
                </div>
              )}
              
              {widgets.find(w => w.id === "bugFixEfficiency" && w.enabled) && (
                <div data-widget-id="bugFixEfficiency">
                  <BugFixEfficiency stats={analytics.bugFixEfficiency} />
                </div>
              )}
              
              {widgets.find(w => w.id === "repeatBugDetector" && w.enabled) && (
                <div data-widget-id="repeatBugDetector">
                  <RepeatBugDetector stats={analytics.repeatBugs} />
                </div>
              )}
              
              {widgets.find(w => w.id === "developerLoad" && w.enabled) && (
                <div data-widget-id="developerLoad">
                  <DeveloperLoad stats={analytics.developerLoad} />
                </div>
              )}
              
              {widgets.find(w => w.id === "focusRecommendations" && w.enabled) && (
                <div data-widget-id="focusRecommendations">
                  <FocusRecommendations recommendations={analytics.focusRecommendations} />
                </div>
              )}
              
              {widgets.find(w => w.id === "bugHeatmap" && w.enabled) && (
                <div data-widget-id="bugHeatmap">
                  <BugHeatmap data={analytics.bugHeatmap} />
                </div>
              )}
              
              {widgets.find(w => w.id === "resolutionHistogram" && w.enabled) && (
                <div data-widget-id="resolutionHistogram">
                  <ResolutionHistogram data={analytics.resolutionHistogram} />
                </div>
              )}
              
              {widgets.find(w => w.id === "priorityScatter" && w.enabled) && (
                <div data-widget-id="priorityScatter">
                  <PriorityScatterPlot data={analytics.priorityScatter} />
                </div>
              )}
              
              {widgets.find(w => w.id === "stackedArea" && w.enabled) && (
                <div data-widget-id="stackedArea">
                  <StackedAreaChart data={analytics.stackedAreaData} />
                </div>
              )}
              
              {widgets.find(w => w.id === "issueFunnel" && w.enabled) && (
                <div data-widget-id="issueFunnel">
                  <IssueFunnelChart stages={analytics.issueFunnel} />
                </div>
              )}
              
              {widgets.find(w => w.id === "backlogWaterfall" && w.enabled) && (
                <div data-widget-id="backlogWaterfall">
                  <BacklogWaterfallChart data={analytics.backlogWaterfall} />
                </div>
              )}
              
              {widgets.find(w => w.id === "moduleTreemap" && w.enabled) && (
                <div data-widget-id="moduleTreemap">
                  <ModuleTreemap data={analytics.moduleTreemap} />
                </div>
              )}
              
              {widgets.find(w => w.id === "moduleRadar" && w.enabled) && (
                <div data-widget-id="moduleRadar">
                  <ModuleRadarChart data={analytics.moduleRadar} />
                </div>
              )}
              
              {widgets.find(w => w.id === "bulletChart" && w.enabled) && (
                <div data-widget-id="bulletChart">
                  <BulletChart metrics={analytics.kpiMetrics} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}