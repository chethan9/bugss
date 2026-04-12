import { useState, useEffect, useRef } from "react";
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
    if (!user) return;
    
    const enabledWidgets = widgets.filter(w => w.enabled);
    if (enabledWidgets.length === 0) {
      toast({
        title: "No widgets selected",
        description: "Please select at least one widget to include in the report.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Initializing...");

    try {
      // Create report record
      const { data: reportData, error: insertError } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          name: reportName || `Report ${new Date().toISOString().split("T")[0]}`,
          file_path: "",
          file_size: 0,
          status: "generating",
          settings: { widgets: enabledWidgets.map(w => w.id), includeHeader, includeSummary },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setGenerationProgress(10);
      setGenerationStatus("Creating PDF document...");

      // Generate PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      // Header
      if (includeHeader) {
        pdf.setFontSize(20);
        pdf.setFont("helvetica", "bold");
        pdf.text("GitHub Issue Analytics Report", margin, yPos + 8);
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(128);
        const dateStr = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        pdf.text(dateStr, pageWidth - margin - pdf.getTextWidth(dateStr), yPos + 8);
        
        pdf.text(`${appName} • Generated Report`, margin, yPos + 15);
        pdf.setTextColor(0);
        
        yPos += 25;
        pdf.setDrawColor(200);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
      }

      setGenerationProgress(20);
      setGenerationStatus("Capturing widgets...");

      // Capture each widget
      const widgetElements = document.querySelectorAll("[data-widget-id]");
      const capturedWidgets: { id: string; canvas: HTMLCanvasElement; width: number; height: number }[] = [];

      let widgetIndex = 0;
      for (const element of Array.from(widgetElements)) {
        const widgetId = element.getAttribute("data-widget-id");
        if (!widgetId || !enabledWidgets.find(w => w.id === widgetId)) continue;

        try {
          const canvas = await html2canvas(element as HTMLElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
          });
          
          capturedWidgets.push({
            id: widgetId,
            canvas,
            width: canvas.width,
            height: canvas.height,
          });
        } catch (err) {
          console.error(`Failed to capture widget ${widgetId}:`, err);
        }

        widgetIndex++;
        const progress = 20 + Math.floor((widgetIndex / enabledWidgets.length) * 50);
        setGenerationProgress(progress);
        setGenerationStatus(`Capturing widget ${widgetIndex} of ${enabledWidgets.length}...`);
      }

      setGenerationProgress(75);
      setGenerationStatus("Arranging layout...");

      // Add widgets to PDF with flow layout
      for (const widget of capturedWidgets) {
        const aspectRatio = widget.width / widget.height;
        const widgetWidth = contentWidth;
        const widgetHeight = widgetWidth / aspectRatio;
        
        // Check if widget fits on current page
        if (yPos + widgetHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }

        const imgData = widget.canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", margin, yPos, widgetWidth, widgetHeight);
        yPos += widgetHeight + 8;
      }

      setGenerationProgress(90);
      setGenerationStatus("Saving report...");

      // Generate PDF blob
      const pdfBlob = pdf.output("blob");
      const fileName = `${reportName.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(`${user.id}/${fileName}`, pdfBlob, {
          contentType: "application/pdf",
        });

      if (uploadError) {
        // If bucket doesn't exist, just save locally
        console.error("Storage upload failed:", uploadError);
        pdf.save(fileName);
      }

      // Update report record
      await supabase
        .from("reports")
        .update({
          file_path: `${user.id}/${fileName}`,
          file_size: pdfBlob.size,
          status: "completed",
        })
        .eq("id", reportData.id);

      // Download the file
      pdf.save(fileName);

      setGenerationProgress(100);
      setGenerationStatus("Complete!");

      toast({
        title: "Report generated",
        description: "Your report has been created and downloaded.",
      });

      // Reload reports list
      loadReports(user.id);

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
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
                    disabled={isGenerating || enabledCount === 0}
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
                        Generate Report
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
      </div>
    </>
  );
}