"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Masonry from "react-masonry-css";
import {
  LayoutGrid,
  GitBranch,
  LogOut,
  Github,
  AlertCircle,
  RefreshCw,
  Key,
  Search,
  X,
  Settings,
  Timer,
  User,
  Calendar,
  Check,
  Trash2,
  PlusCircle,
  ChevronDown,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ProgressBar } from "@/components/ProgressBar";
import { IssueTable, type GitHubIssue } from "@/components/IssueTable";
import { IssueDetailsModal } from "@/components/IssueDetailsModal";
import { FilterMenu } from "@/components/FilterMenu";
import {
  WidgetSettingsPanel,
  DEFAULT_VISIBILITY,
  DEFAULT_WIDGET_ORDER,
  type WidgetVisibility,
} from "@/components/WidgetSettings";
import {
  ReportSettingsPanel,
  type ReportConfig,
  DEFAULT_REPORT_CONFIG,
} from "@/components/ReportSettings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { DataFetchingLoader } from "@/components/LoadingSpinner";
import { SmartInsights } from "@/components/analytics/SmartInsights";
import { BugSeverityHeatmap } from "@/components/analytics/BugSeverityHeatmap";
import { AverageResolutionTime } from "@/components/analytics/AverageResolutionTime";
import { IssueTrendChart } from "@/components/analytics/IssueTrendChart";
import { ModuleStabilityScore } from "@/components/analytics/ModuleStabilityScore";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
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
import { Sparkline } from "@/components/analytics/Sparkline";
import { RepositoryFilter } from "@/components/analytics/RepositoryFilter";
import { ProjectHealthGauge } from "@/components/analytics/ProjectHealthGauge";
import { BurndownChart } from "@/components/analytics/BurndownChart";
import { FlowEfficiency } from "@/components/analytics/FlowEfficiency";
import {
  disconnectGitHub,
  disconnectGitHubConnection,
  fetchUserRepositories,
  getGitHubConnection,
  getGitHubConnections,
  migrateLegacyGithubTokenIfPresent,
  normalizeProfileName,
  saveGitHubConnection,
  setActiveGitHubConnection,
  type GitHubRepository,
} from "@/services/githubService";
import {
  computeDashboardAnalytics,
  INITIAL_WIDGET_ROWS,
  WIDGET_ROWS_INCREMENT,
} from "@/lib/dashboardWidgetAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { getUserSettings, saveUserSettings } from "@/services/userSettingsService";
import { SEO } from "@/components/SEO";

const LazyPDFExport = dynamic(
  () => import("@/components/PDFExport").then((m) => ({ default: m.PDFExport })),
  {
    ssr: false,
    loading: () => (
      <span className="text-sm text-muted-foreground p-4 inline-block">Loading export…</span>
    ),
  }
);

const STORAGE_KEYS = {
  TOKEN: "github_token_encoded",
  REPOS: "github_selected_repos",
  REMEMBER: "github_remember_me",
} as const;

function saveTokenToStorage(token: string, repos: string[], remember: boolean) {
  if (!remember) {
    clearStoredCredentials();
    return;
  }
  
  try {
    const encodedToken = btoa(token);
    localStorage.setItem(STORAGE_KEYS.TOKEN, encodedToken);
    localStorage.setItem(STORAGE_KEYS.REPOS, JSON.stringify(repos));
    localStorage.setItem(STORAGE_KEYS.REMEMBER, "true");
  } catch (error) {
    console.error("Failed to save credentials:", error);
  }
}

function loadTokenFromStorage(): { token: string; repos: string[] } | null {
  try {
    const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER);
    if (remember !== "true") return null;
    
    const encodedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const reposJson = localStorage.getItem(STORAGE_KEYS.REPOS);
    
    if (!encodedToken || !reposJson) return null;
    
    const token = atob(encodedToken);
    const repos = JSON.parse(reposJson);
    
    return { token, repos };
  } catch (error) {
    console.error("Failed to load credentials:", error);
    return null;
  }
}

function clearStoredCredentials() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REPOS);
  localStorage.removeItem(STORAGE_KEYS.REMEMBER);
}

export default function Home() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [githubToken, setGithubToken] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [rememberMe, setRememberMe] = useState(false);
  const [isStoredConnection, setIsStoredConnection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute default
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  
  const [availableRepos, setAvailableRepos] = useState<GitHubRepository[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");
  const [connectionStep, setConnectionStep] = useState<"token" | "repos">("token");
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [dialogSelectedRepos, setDialogSelectedRepos] = useState<string[]>([]);
  
  const [connectionProfileName, setConnectionProfileName] = useState("");
  const [pendingConnectionSaveId, setPendingConnectionSaveId] = useState<string | null>(null);

  const [showWidgetSettingsDialog, setShowWidgetSettingsDialog] = useState(false);
  const [showReportSettingsDialog, setShowReportSettingsDialog] = useState(false);
  const [showPdfExportDialog, setShowPdfExportDialog] = useState(false);
  const [githubProfilePopoverOpen, setGithubProfilePopoverOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  
  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>(DEFAULT_VISIBILITY);
  const [widgetsPerRow, setWidgetsPerRow] = useState(2);
  const [widgetOrder, setWidgetOrder] = useState<(keyof WidgetVisibility)[]>(DEFAULT_WIDGET_ORDER);
  const [visibleWidgetRows, setVisibleWidgetRows] = useState(INITIAL_WIDGET_ROWS);
  const [reportConfig, setReportConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG);

  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [githubConnections, setGithubConnections] = useState<
    Awaited<ReturnType<typeof getGitHubConnections>>
  >([]);
  const [activeGithubConnectionId, setActiveGithubConnectionId] = useState<string | null>(null);
  const [appName, setAppName] = useState("Bugzilla");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<number>(1);
  const router = useRouter();

  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [issuesError, setIssuesError] = useState("");

  const [filters, setFilters] = useState({
    repositories: [] as string[],
    labels: [] as string[],
    statuses: [] as string[],
    search: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Auth check and settings loading
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Redirect to login if not authenticated
        if (!session?.user) {
          router.push("/auth");
          return;
        }
        
        setUser(session.user);

        await migrateLegacyGithubTokenIfPresent();

        const [settings, connections] = await Promise.all([
          getUserSettings(session.user.id),
          getGitHubConnections(),
        ]);

        setGithubConnections(connections);
        setActiveGithubConnectionId(settings?.active_github_connection_id ?? null);

        if (settings) {
          if (settings.widget_visibility) {
            setWidgetVisibility(settings.widget_visibility as WidgetVisibility);
          }
          if (settings.widget_order) {
            setWidgetOrder(settings.widget_order as (keyof WidgetVisibility)[]);
          }
          if (settings.widgets_per_row) {
            setWidgetsPerRow(settings.widgets_per_row);
          }
          if (settings.app_name) {
            setAppName(settings.app_name);
          }
          if (settings.logo_url) {
            setLogoUrl(settings.logo_url);
          }
          const conn = await getGitHubConnection();
          if (conn?.access_token) {
            const t = conn.access_token;
            setGithubToken(t);
            setToken(t);
            if (settings.selected_repos && settings.selected_repos.length > 0) {
              setSelectedRepos(settings.selected_repos);
              fetchSelectedIssues(settings.selected_repos, t);
            }
          }
        }
        
        // Load app version
        const { data: versionData } = await supabase
          .from("app_version")
          .select("version_number")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();
        
        if (versionData) {
          setAppVersion(versionData.version_number);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/auth");
      } finally {
        setIsAuthLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        router.push("/auth");
        return;
      }
      setUser(session.user);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Save settings when they change (debounced)
  useEffect(() => {
    if (!user) return;
    
    const saveTimeout = setTimeout(async () => {
      await saveUserSettings(user.id, {
        widget_visibility: widgetVisibility,
        widget_order: widgetOrder,
        widgets_per_row: widgetsPerRow,
        selected_repos: selectedRepos,
      });
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  }, [user, widgetVisibility, widgetOrder, widgetsPerRow, selectedRepos]);

  useEffect(() => {
    setVisibleWidgetRows(INITIAL_WIDGET_ROWS);
  }, [selectedRepos, widgetVisibility, widgetOrder, widgetsPerRow]);

  useEffect(() => {
    console.log("🟢 Auto-load useEffect running...");
    const stored = loadTokenFromStorage();
    console.log("🟢 Stored credentials:", stored);
    if (stored) {
      console.log("🟢 Found stored credentials, loading...");
      setGithubToken(stored.token);
      setSelectedRepos(stored.repos);
      setIsStoredConnection(true);
      setToken(stored.token);
      
      // Fetch issues immediately when loading stored credentials
      if (stored.token && stored.repos.length > 0) {
        console.log("🟢 Auto-fetching issues for repos:", stored.repos);
        fetchSelectedIssues(stored.repos, stored.token);
      }
    } else {
      console.log("🟢 No stored credentials found");
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("widgetVisibility");
    if (saved) {
      try {
        setWidgetVisibility(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load widget preferences:", e);
      }
    }

    const savedReportConfig = localStorage.getItem("reportConfig");
    if (savedReportConfig) {
      try {
        setReportConfig(JSON.parse(savedReportConfig));
      } catch (e) {
        console.error("Failed to load report config:", e);
      }
    }
  }, []);

  const handleVisibilityChange = (newVisibility: WidgetVisibility) => {
    setWidgetVisibility(newVisibility);
    localStorage.setItem("widgetVisibility", JSON.stringify(newVisibility));
  };

  const handleReportConfigChange = (newConfig: ReportConfig) => {
    setReportConfig(newConfig);
    localStorage.setItem("reportConfig", JSON.stringify(newConfig));
  };

  const handleFetchIssues = async (tokenParam?: string, reposParam?: string[]) => {
    const tokenToUse = tokenParam || githubToken;
    const reposToUse = reposParam || selectedRepos;
    
    if (!tokenToUse || reposToUse.length === 0) {
      alert("Please provide a GitHub token and select repositories");
      return;
    }

    setLoading(true);
    setIsLoadingIssues(true);
    try {
      setToken(tokenToUse);
      setSelectedRepos(reposToUse);
      await fetchSelectedIssues(reposToUse, tokenToUse);
      
      if (rememberMe && !tokenParam) {
        saveTokenToStorage(tokenToUse, reposToUse, true);
        setIsStoredConnection(true);
      }
    } catch (error: any) {
      console.error("Failed to fetch issues:", error);
      alert(`Error: ${error.message}`);
      
      if (error.message.includes("401") || error.message.includes("Bad credentials")) {
        clearStoredCredentials();
        setIsStoredConnection(false);
      }
    } finally {
      setLoading(false);
      setIsLoadingIssues(false);
    }
  };

  const handleDisconnect = async () => {
    setGithubToken("");
    setSelectedRepos([]);
    setAvailableRepos([]);
    setIssues([]);
    setToken("");
    clearStoredCredentials();
    setIsStoredConnection(false);
    setRememberMe(false);
    setConnectionStep("token");
    setShowConnectionDialog(false);
    
    // Clear token from Supabase
    if (user) {
      try {
        await disconnectGitHub();
      } catch (e) {
        console.error("disconnectGitHub:", e);
      }
      await saveUserSettings(user.id, {
        github_token: null,
        selected_repos: [],
        active_github_connection_id: null,
      });
    }
    setGithubConnections([]);
    setActiveGithubConnectionId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    handleDisconnect();
    router.push("/auth");
  };

  const fetchSelectedIssues = async (repos: string[], tokenToUse: string) => {
    console.log("🟡 fetchSelectedIssues called with repos:", repos);
    const { fetchRepositoryIssues } = await import("@/services/githubService");
    const allIssues: GitHubIssue[] = [];
    
    for (const repo of repos) {
      try {
        console.log(`🟡 Fetching issues for ${repo}...`);
        const [owner, name] = repo.split('/');
        const apiIssues = await fetchRepositoryIssues(owner, name, tokenToUse);
        console.log(`🟡 Received ${apiIssues.length} issues for ${repo}`);
        
        // Transform API response to match IssueTable format
        const transformedIssues: GitHubIssue[] = apiIssues.map((issue: any) => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body || "",
          status: (issue.state === "open" ? "open" : "closed") as "open" | "closed" | "in_progress",
          labels: issue.labels.map((l: any) => l.name),
          assignees: issue.assignees.map((a: any) => a.login),
          repository: repo,
          url: issue.html_url,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          closedAt: issue.closed_at,
        }));
        
        allIssues.push(...transformedIssues);
      } catch (error) {
        console.error(`❌ Failed to fetch issues for ${repo}:`, error);
      }
    }
    
    console.log(`🟡 Total issues fetched: ${allIssues.length}`);
    console.log("🟡 Setting issues state...", allIssues);
    setIssues(allIssues);
  };

  const handleSwitchGithubAccount = async (connectionId: string) => {
    if (!user) return;
    try {
      await setActiveGitHubConnection(connectionId);
      setActiveGithubConnectionId(connectionId);
      const conn = await getGitHubConnection();
      const t = conn?.access_token;
      if (t) {
        setToken(t);
        setGithubToken(t);
      }
      setSelectedRepos([]);
      setIssues([]);
      await saveUserSettings(user.id, { selected_repos: [] });
      const list = await getGitHubConnections();
      setGithubConnections(list);
    } catch (e: unknown) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not switch account");
    }
  };

  const handleRemoveGithubConnection = async (connectionId: string) => {
    if (!user) return;
    try {
      await disconnectGitHubConnection(connectionId);
      const next = await getGitHubConnections();
      setGithubConnections(next);
      const st = await getUserSettings(user.id);
      setActiveGithubConnectionId(st?.active_github_connection_id ?? null);
      const conn = await getGitHubConnection();
      if (conn?.access_token) {
        setToken(conn.access_token);
        setGithubToken(conn.access_token);
      } else {
        setToken("");
        setGithubToken("");
        setSelectedRepos([]);
        setIssues([]);
      }
    } catch (e: unknown) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not remove account");
    }
  };

  const handleDisconnectAllGithubFromNav = async () => {
    await handleDisconnect();
  };

  const handleTokenSubmit = async () => {
    if (!githubToken) {
      alert("Please enter a GitHub token");
      return;
    }

    let profileLabel: string;
    try {
      profileLabel = normalizeProfileName(connectionProfileName.trim());
    } catch (e) {
      alert(e instanceof Error ? e.message : "Invalid profile name");
      return;
    }

    const cleanToken = githubToken.trim();
    
    if (cleanToken.length < 20) {
      alert("Invalid token format. GitHub tokens are typically 40+ characters long.");
      return;
    }

    if (!user) {
      alert("You must be signed in.");
      return;
    }

    setIsLoadingRepos(true);
    try {
      const repos = await fetchUserRepositories(cleanToken);
      
      if (repos.length === 0) {
        alert("No repositories found. This could mean:\n1. Your account has no repositories\n2. Your token lacks repo (and read:org for org listing) scopes\n3. Your organization has not approved this app for third-party access");
        return;
      }

      await saveGitHubConnection(cleanToken, {
        profileName: profileLabel,
        connectionId: pendingConnectionSaveId ?? undefined,
      });
      const nextConnections = await getGitHubConnections();
      setGithubConnections(nextConnections);
      const st = await getUserSettings(user.id);
      setActiveGithubConnectionId(st?.active_github_connection_id ?? null);
      
      setAvailableRepos(repos);
      setConnectionStep("repos");
      setToken(cleanToken);
      setGithubToken(cleanToken);
      setDialogSelectedRepos([...selectedRepos]);
    } catch (error: any) {
      console.error("Failed to fetch repositories:", error);
      
      const errorMessage = error.message || "Unknown error occurred";
      alert(`❌ Error: ${errorMessage}\n\nCheck token permissions and validity.`);
      
      if (error.message.includes("Invalid") || error.message.includes("401") || error.message.includes("expired")) {
        clearStoredCredentials();
        setIsStoredConnection(false);
      }
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleRepoSelectionComplete = async () => {
    console.log("🔴 handleRepoSelectionComplete called");
    console.log("🔴 dialogSelectedRepos:", dialogSelectedRepos);
    console.log("🔴 token:", token ? "present" : "MISSING");
    
    if (dialogSelectedRepos.length === 0) {
      alert("Please select at least one repository");
      return;
    }

    setLoading(true);
    setIsLoadingIssues(true);
    try {
      // Apply the dialog selection to main state
      setSelectedRepos(dialogSelectedRepos);
      
      console.log("🔴 Calling fetchSelectedIssues...");
      await fetchSelectedIssues(dialogSelectedRepos, token);
      console.log("🔴 fetchSelectedIssues completed");
      
      // Save token and repos to Supabase for persistence
      if (user) {
        await saveUserSettings(user.id, {
          selected_repos: dialogSelectedRepos,
        });
      }
      
      if (rememberMe) {
        saveTokenToStorage(githubToken, dialogSelectedRepos, true);
        setIsStoredConnection(true);
      }
      
      console.log("🔴 Closing dialog");
      setShowConnectionDialog(false);
      setConnectionStep("token");
      setRepoSearchQuery("");
    } catch (error: any) {
      console.error("❌ Failed to fetch issues:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setIsLoadingIssues(false);
      console.log("🔴 handleRepoSelectionComplete finished");
    }
  };

  const filteredRepos = useMemo(() => {
    if (!repoSearchQuery) return availableRepos;
    
    const query = repoSearchQuery.toLowerCase();
    return availableRepos.filter(repo => 
      repo.full_name.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query) ||
      repo.language?.toLowerCase().includes(query)
    );
  }, [availableRepos, repoSearchQuery]);

  const toggleRepoSelection = (repoFullName: string) => {
    console.log("🔵 toggleRepoSelection called for:", repoFullName);
    setDialogSelectedRepos(prev => {
      const newSelection = prev.includes(repoFullName)
        ? prev.filter(r => r !== repoFullName)
        : [...prev, repoFullName];
      console.log("🔵 New dialog selection:", newSelection);
      return newSelection;
    });
  };

  const selectAllFilteredRepos = () => {
    console.log("🔵 selectAllFilteredRepos called");
    const allFilteredNames = filteredRepos.map(r => r.full_name);
    setDialogSelectedRepos(prev => {
      const newSet = new Set([...prev, ...allFilteredNames]);
      return Array.from(newSet);
    });
  };

  const deselectAllRepos = () => {
    console.log("🔵 deselectAllRepos called");
    setDialogSelectedRepos([]);
  };

  const handleManageRepositories = async () => {
    const tokenToUse = token || githubToken;
    
    if (!tokenToUse) {
      setConnectionStep("token");
      setDialogSelectedRepos([]);
      setConnectionProfileName("");
      setPendingConnectionSaveId(null);
      setShowConnectionDialog(true);
      return;
    }

    // Token exists - go directly to repo selection
    setDialogSelectedRepos([...selectedRepos]); // Initialize with current selection
    setShowConnectionDialog(true);
    setIsLoadingRepos(true);
    setConnectionStep("repos");
    
    try {
      console.log("🔄 Fetching repositories for management...");
      const repos = await fetchUserRepositories(tokenToUse);
      setAvailableRepos(repos);
    } catch (error: any) {
      console.error("Failed to fetch repositories:", error);
      
      if (error.message.includes("Invalid") || error.message.includes("401") || error.message.includes("Bad credentials")) {
        // Token is invalid - show token entry screen
        clearStoredCredentials();
        setIsStoredConnection(false);
        setConnectionStep("token");
        alert("Your GitHub token is invalid or expired. Please enter a new one.");
      } else {
        alert(`Error: ${error.message}`);
        setShowConnectionDialog(false);
      }
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!token || selectedRepos.length === 0 || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchSelectedIssues(selectedRepos, token);
    } catch (error) {
      console.error("Failed to refresh issues:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !token || selectedRepos.length === 0) return;
    
    const intervalId = setInterval(() => {
      console.log("🔄 Auto-refreshing issues...");
      fetchSelectedIssues(selectedRepos, token);
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, token, selectedRepos]);

  const handleIssueClick = (issue: GitHubIssue) => {
    setSelectedIssue(issue);
    setIsIssueModalOpen(true);
  };

  const availableLabels = useMemo(() => {
    const labelSet = new Set<string>();
    issues.forEach((issue) => issue.labels.forEach((l) => labelSet.add(l)));
    return Array.from(labelSet).sort();
  }, [issues]);

  const availableRepositories = useMemo(() => {
    const repoSet = new Set<string>();
    issues.forEach((issue) => repoSet.add(issue.repository));
    return Array.from(repoSet).sort();
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filters.repositories.length > 0 && !filters.repositories.includes(issue.repository)) return false;
      if (filters.labels.length > 0) {
        const hasAllLabels = filters.labels.every((l) => issue.labels.includes(l));
        if (!hasAllLabels) return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(issue.status)) return false;
      if (dateRange.start && new Date(issue.createdAt) < dateRange.start) return false;
      if (dateRange.end && new Date(issue.createdAt) > dateRange.end) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(query);
        const matchesNumber = issue.number.toString().includes(query);
        if (!matchesTitle && !matchesNumber) return false;
      }
      return true;
    });
  }, [issues, filters, dateRange]);

  const visibleOrderedWidgets = useMemo(
    () => widgetOrder.filter((key) => widgetVisibility[key]),
    [widgetOrder, widgetVisibility]
  );

  const widgetsToRender = useMemo(() => {
    const limit = widgetsPerRow * visibleWidgetRows;
    return visibleOrderedWidgets.slice(0, limit);
  }, [visibleOrderedWidgets, widgetsPerRow, visibleWidgetRows]);

  const hiddenWidgetCount = Math.max(0, visibleOrderedWidgets.length - widgetsToRender.length);
  const hasMoreWidgets = hiddenWidgetCount > 0;

  const analytics = useMemo(
    () => computeDashboardAnalytics(filteredIssues, widgetsToRender),
    [filteredIssues, widgetsToRender]
  );

  const metrics = useMemo(() => {
    const statusCounts = { open: 0, inProgress: 0, closed: 0 };
    filteredIssues.forEach((issue) => {
      if (issue.status === "open") statusCounts.open++;
      else if (issue.status === "in_progress") statusCounts.inProgress++;
      else if (issue.status === "closed") statusCounts.closed++;
    });
    return { statusCounts };
  }, [filteredIssues]);

  const clearFilters = () => {
    setFilters({
      repositories: [],
      labels: [],
      statuses: [],
      search: "",
    });
  };

  const openAddGitHubProfileDialog = () => {
    setTokenError("");
    setConnectionProfileName("");
    setPendingConnectionSaveId(null);
    setGithubToken("");
    setConnectionStep("token");
    setShowConnectionDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => {
              if (window.location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                router.push("/");
              }
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
          >
            <Logo appName={appName} logoUrl={logoUrl} />
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 shrink-0">
              v{appVersion}
            </Badge>
          </button>
          </div>
          
          <div className="flex items-center gap-2">
            {user && githubConnections.length > 0 && (
              <Popover open={githubProfilePopoverOpen} onOpenChange={setGithubProfilePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 max-w-[200px] shrink min-w-0" type="button">
                    <Github className="h-4 w-4 shrink-0" />
                    <span className="truncate hidden sm:inline">
                      {(() => {
                        const c =
                          githubConnections.find((x) => x.id === activeGithubConnectionId) ??
                          githubConnections[0];
                        return c ? c.profile_name : "GitHub";
                      })()}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground">
                    GitHub profiles
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {githubConnections.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted ${
                          activeGithubConnectionId === c.id ? "bg-muted/70" : ""
                        }`}
                        onClick={() => {
                          void handleSwitchGithubAccount(c.id);
                          setGithubProfilePopoverOpen(false);
                        }}
                      >
                        {activeGithubConnectionId === c.id ? (
                          <Check className="h-4 w-4 shrink-0" />
                        ) : (
                          <Github className="h-4 w-4 shrink-0 opacity-60" />
                        )}
                        <span className="truncate">
                          <span className="font-medium">{c.profile_name}</span>
                          <span className="text-muted-foreground"> @{c.username}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t space-y-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-9"
                      type="button"
                      onClick={() => {
                        setGithubProfilePopoverOpen(false);
                        openAddGitHubProfileDialog();
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2 shrink-0" />
                      Add profile…
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-9"
                      type="button"
                      onClick={() => {
                        setGithubProfilePopoverOpen(false);
                        router.push("/profile");
                      }}
                    >
                      <User className="h-4 w-4 mr-2 shrink-0" />
                      Manage profiles
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {user && (token || githubToken).trim() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleManageRepositories()}
                className="gap-2 shrink-0"
                type="button"
              >
                <GitBranch className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Repositories{selectedRepos.length > 0 ? ` (${selectedRepos.length})` : ""}
                </span>
              </Button>
            )}

            {selectedRepos.length > 0 && (
              <>
                {/* Column Selector */}
                <div className="hidden md:flex items-center border rounded-md">
                  {[1, 2, 3, 4].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => setWidgetsPerRow(cols)}
                      className={`p-1.5 transition-colors ${
                        widgetsPerRow === cols 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                      title={`${cols} column${cols > 1 ? "s" : ""}`}
                    >
                      {cols === 1 && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-80">
                          <rect x="2" y="2" width="12" height="2" rx="0.5" fill="currentColor"/>
                          <rect x="2" y="6" width="12" height="2" rx="0.5" fill="currentColor"/>
                          <rect x="2" y="10" width="12" height="2" rx="0.5" fill="currentColor"/>
                        </svg>
                      )}
                      {cols === 2 && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-80">
                          <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor"/>
                          <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor"/>
                          <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor"/>
                          <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor"/>
                        </svg>
                      )}
                      {cols === 3 && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-80">
                          <rect x="1" y="2" width="4" height="4" rx="0.5" fill="currentColor"/>
                          <rect x="6" y="2" width="4" height="4" rx="0.5" fill="currentColor"/>
                          <rect x="11" y="2" width="4" height="4" rx="0.5" fill="currentColor"/>
                          <rect x="1" y="7" width="4" height="4" rx="0.5" fill="currentColor"/>
                          <rect x="6" y="7" width="4" height="4" rx="0.5" fill="currentColor"/>
                          <rect x="11" y="7" width="4" height="4" rx="0.5" fill="currentColor"/>
                        </svg>
                      )}
                      {cols === 4 && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-80">
                          <rect x="1" y="1" width="3" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="5" y="1" width="3" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="9" y="1" width="3" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="13" y="1" width="2" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="1" y="5" width="3" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="5" y="5" width="3" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="9" y="5" width="3" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="13" y="5" width="2" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="1" y="9" width="3" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="5" y="9" width="3" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="9" y="9" width="3" height="3" rx="0.5" fill="currentColor"/>
                          <rect x="13" y="9" width="2" height="3" rx="0.5" fill="currentColor"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Refresh Controls */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  title="Refresh issues"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
                
                {/* Time Frame Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs hidden sm:inline">
                        {dateRange.start && dateRange.end 
                          ? `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`
                          : dateRange.start 
                            ? `Since ${dateRange.start.toLocaleDateString()}`
                            : "All Time"
                        }
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Time Frame
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDateRange({ start: null, end: null })}>
                      <Calendar className="h-4 w-4 mr-2" />
                      All Time
                      {!dateRange.start && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
                      setDateRange({ start, end: now });
                    }}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Last 3 Days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      setDateRange({ start, end: now });
                    }}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Last 7 Days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                      setDateRange({ start, end: now });
                    }}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Last 30 Days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                      setDateRange({ start, end: now });
                    }}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Last 90 Days
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            
            <ThemeToggle />
            
            {/* Main Menu - Rightmost */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 max-h-[min(520px,85vh)] overflow-y-auto"
              >
                {user && (
                  <>
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground truncate">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="h-4 w-4 mr-2 shrink-0" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
                      GitHub
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => void handleManageRepositories()}
                      className="font-medium"
                    >
                      <GitBranch className="h-4 w-4 mr-2 shrink-0" />
                      Repositories
                      {selectedRepos.length > 0 ? ` (${selectedRepos.length})` : ""}
                    </DropdownMenuItem>
                    {githubConnections.map((c) => (
                      <Fragment key={c.id}>
                        <DropdownMenuItem
                          disabled={activeGithubConnectionId === c.id}
                          onClick={() => void handleSwitchGithubAccount(c.id)}
                        >
                          {activeGithubConnectionId === c.id ? (
                            <Check className="h-4 w-4 mr-2 shrink-0" />
                          ) : (
                            <Github className="h-4 w-4 mr-2 shrink-0" />
                          )}
                          <span className="truncate">
                            Use <span className="font-medium">{c.profile_name}</span> (@{c.username})
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => void handleRemoveGithubConnection(c.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">Remove {c.profile_name}</span>
                        </DropdownMenuItem>
                      </Fragment>
                    ))}
                    <DropdownMenuItem onClick={() => openAddGitHubProfileDialog()}>
                      <PlusCircle className="h-4 w-4 mr-2 shrink-0" />
                      Add profile (token)…
                    </DropdownMenuItem>
                    {githubConnections.length > 0 && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => void handleDisconnectAllGithubFromNav()}
                      >
                        <LogOut className="h-4 w-4 mr-2 shrink-0" />
                        Disconnect all GitHub
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {selectedRepos.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
                      Dashboard
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => void handleManageRepositories()}>
                      <GitBranch className="h-4 w-4 mr-2 shrink-0" />
                      Manage repositories
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowWidgetSettingsDialog(true)}>
                      <Settings className="h-4 w-4 mr-2 shrink-0" />
                      Widget layout…
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowReportSettingsDialog(true)}>
                      <Settings className="h-4 w-4 mr-2 shrink-0" />
                      Report settings…
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={filteredIssues.length === 0}
                      onClick={() => setShowPdfExportDialog(true)}
                    >
                      <FileDown className="h-4 w-4 mr-2 shrink-0" />
                      Export PDF…
                    </DropdownMenuItem>
                  </>
                )}

                {user ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2 shrink-0" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => router.push("/auth")}>
                    <User className="h-4 w-4 mr-2 shrink-0" />
                    Sign In
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {selectedRepos.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <GitBranch className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-heading font-bold mb-2">
              {(token || githubToken).trim() ? "Choose repositories" : "Add a GitHub profile"}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              {(token || githubToken).trim()
                ? "Pick one or more repositories to load issues and dashboards for the active profile."
                : "Create a named profile and paste a Personal Access Token. You can add multiple profiles and switch between them from the header or Menu."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
              <Button size="lg" className="w-full sm:w-auto" onClick={() => void handleManageRepositories()}>
                <GitBranch className="h-4 w-4 mr-2" />
                {(token || githubToken).trim() ? "Choose repositories" : "Repositories"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => openAddGitHubProfileDialog()}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add profile (token)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6 max-w-md">
              Tip: use the <span className="font-medium">GitHub</span> button in the header to switch profiles, or{" "}
              <span className="font-medium">Menu</span> → GitHub.
            </p>
          </div>
        ) : (
          <>
            {isLoadingIssues ? (
              <DataFetchingLoader 
                repoCount={selectedRepos.length}
              />
            ) : (
              <>
                <Masonry
                  breakpointCols={{
                    default: widgetsPerRow,
                    1280: Math.min(widgetsPerRow, 3),
                    1024: Math.min(widgetsPerRow, 2),
                    768: 1
                  }}
                  className="flex -ml-6 w-auto"
                  columnClassName="pl-6 bg-clip-padding"
                  id="analytics-widgets-section"
                >
                  {widgetsToRender.map((widgetKey) => {
                    switch (widgetKey) {
                      case "repositoryFilter":
                        return selectedRepos.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <RepositoryFilter
                              repositories={selectedRepos}
                              activeRepositories={filters.repositories.length > 0 ? filters.repositories : selectedRepos}
                              onToggle={(repo) => {
                                setFilters(prev => {
                                  const currentActive = prev.repositories.length > 0 ? prev.repositories : selectedRepos;
                                  const isActive = currentActive.includes(repo);
                                  let newRepos: string[];
                                  
                                  if (isActive) {
                                    newRepos = currentActive.filter(r => r !== repo);
                                  } else {
                                    newRepos = [...currentActive, repo];
                                  }
                                  
                                  // If all repos are selected, clear the filter
                                  if (newRepos.length === selectedRepos.length) {
                                    newRepos = [];
                                  }
                                  
                                  return { ...prev, repositories: newRepos };
                                });
                              }}
                              issueCounts={issues.reduce((acc, issue) => {
                                acc[issue.repository] = (acc[issue.repository] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)}
                            />
                          </div>
                        ) : null;
                      case "smartInsights":
                        return analytics.insights.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <SmartInsights insights={analytics.insights} />
                          </div>
                        ) : null;
                      case "summaryMetrics":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <DashboardMetrics
                              totalRepos={selectedRepos.length}
                              totalIssues={filteredIssues.length}
                              openIssues={metrics.statusCounts.open}
                              closedIssues={metrics.statusCounts.closed}
                              isLoading={isLoadingIssues}
                            />
                          </div>
                        );
                      case "progressBar":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <ProgressBar
                              open={metrics.statusCounts.open}
                              inProgress={metrics.statusCounts.inProgress || 0}
                              closed={metrics.statusCounts.closed}
                              total={filteredIssues.length}
                              isLoading={isLoadingIssues}
                            />
                          </div>
                        );
                      case "projectHealthGauge":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <ProjectHealthGauge issues={filteredIssues} isLoading={isLoadingIssues} />
                          </div>
                        );
                      case "burndownChart":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <BurndownChart issues={filteredIssues} />
                          </div>
                        );
                      case "flowEfficiency":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <FlowEfficiency issues={filteredIssues} />
                          </div>
                        );
                      case "severityHeatmap":
                        return Object.values(analytics.severities).some(v => v > 0) ? (
                          <div key={widgetKey} className="mb-6">
                            <BugSeverityHeatmap severities={analytics.severities} />
                          </div>
                        ) : null;
                      case "resolutionTime":
                        return analytics.resolutionTime.overall > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <AverageResolutionTime stats={analytics.resolutionTime} />
                          </div>
                        ) : null;
                      case "trendChart":
                        return analytics.trend.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <IssueTrendChart data={analytics.trend} days={30} />
                          </div>
                        ) : null;
                      case "moduleStability":
                        return analytics.stability.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <ModuleStabilityScore stability={analytics.stability} />
                          </div>
                        ) : null;
                      case "reopenedIssues":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <ReopenedIssuesTracker stats={analytics.reopened} />
                          </div>
                        );
                      case "categoryBreakdown":
                        return Object.values(analytics.categories).some(v => v > 0) ? (
                          <div key={widgetKey} className="mb-6">
                            <BugCategoryBreakdown categories={analytics.categories} />
                          </div>
                        ) : null;
                      case "bugHotspots":
                        return analytics.hotspots.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <BugHotspots hotspots={analytics.hotspots} />
                          </div>
                        ) : null;
                      case "atRiskRelease":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <AtRiskRelease stats={analytics.atRiskRelease} />
                          </div>
                        );
                      case "agingIssues":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <AgingIssues stats={analytics.agingIssues} />
                          </div>
                        );
                      case "criticalUntouched":
                        return analytics.criticalUntouched.issues.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <CriticalUntouched stats={analytics.criticalUntouched} />
                          </div>
                        ) : null;
                      case "backlogGrowth":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <BacklogGrowth stats={analytics.backlogGrowth} />
                          </div>
                        );
                      case "bugFixEfficiency":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <BugFixEfficiency stats={analytics.bugFixEfficiency} />
                          </div>
                        );
                      case "repeatBugDetector":
                        return analytics.repeatBugs.topRepeatingLabels.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <RepeatBugDetector stats={analytics.repeatBugs} />
                          </div>
                        ) : null;
                      case "developerLoad":
                        return analytics.developerLoad.developers.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <DeveloperLoad stats={analytics.developerLoad} />
                          </div>
                        ) : null;
                      case "focusRecommendations":
                        return analytics.focusRecommendations.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <FocusRecommendations recommendations={analytics.focusRecommendations} />
                          </div>
                        ) : null;
                      case "bugHeatmap":
                        return analytics.bugHeatmap.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <BugHeatmap data={analytics.bugHeatmap} />
                          </div>
                        ) : null;
                      case "resolutionHistogram":
                        return analytics.resolutionHistogram.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <ResolutionHistogram data={analytics.resolutionHistogram} />
                          </div>
                        ) : null;
                      case "priorityScatterPlot":
                        return analytics.priorityScatter.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <PriorityScatterPlot data={analytics.priorityScatter} />
                          </div>
                        ) : null;
                      case "stackedAreaChart":
                        return analytics.stackedAreaData.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <StackedAreaChart data={analytics.stackedAreaData} />
                          </div>
                        ) : null;
                      case "issueFunnelChart":
                        return analytics.issueFunnel.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <IssueFunnelChart stages={analytics.issueFunnel} />
                          </div>
                        ) : null;
                      case "backlogWaterfallChart":
                        return analytics.backlogWaterfall.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <BacklogWaterfallChart data={analytics.backlogWaterfall} />
                          </div>
                        ) : null;
                      case "moduleTreemap":
                        return analytics.moduleTreemap.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <ModuleTreemap data={analytics.moduleTreemap} />
                          </div>
                        ) : null;
                      case "moduleRadarChart":
                        return analytics.moduleRadar.length > 0 ? (
                          <div key={widgetKey} className="mb-6">
                            <ModuleRadarChart data={analytics.moduleRadar} />
                          </div>
                        ) : null;
                      case "kpiBulletChart":
                        return (
                          <div key={widgetKey} className="mb-6">
                            <BulletChart metrics={analytics.kpiMetrics} />
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </Masonry>

                {hasMoreWidgets && (
                  <div className="flex justify-center py-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={() =>
                        setVisibleWidgetRows((rows) => rows + WIDGET_ROWS_INCREMENT)
                      }
                    >
                      <ChevronDown className="h-4 w-4" />
                      Load more widgets
                      <span className="text-muted-foreground font-normal">
                        ({hiddenWidgetCount} remaining)
                      </span>
                    </Button>
                  </div>
                )}

                {availableLabels.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Issues</h3>
                        <span className="text-sm text-muted-foreground">
                          Showing {Math.min(filteredIssues.length, itemsPerPage)} of {filteredIssues.length}
                        </span>
                      </div>
                      {filters.labels.length > 0 && (
                        <button
                          onClick={() => setFilters({ ...filters, labels: [] })}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          Clear labels
                        </button>
                      )}
                    </div>
                    {(() => {
                      // Calculate label counts
                      const labelCounts = new Map<string, number>();
                      filteredIssues.forEach((issue) => {
                        issue.labels.forEach((label) => {
                          labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
                        });
                      });
                      
                      // Sort by count and get top labels
                      const sortedLabels = availableLabels
                        .map((label) => ({ label, count: labelCounts.get(label) || 0 }))
                        .sort((a, b) => b.count - a.count);
                      
                      const top7Labels = sortedLabels.slice(0, 7);
                      const remainingLabels = sortedLabels.slice(7);
                      const hasMore = remainingLabels.length > 0;
                      
                      return (
                        <div className="flex gap-2 flex-wrap">
                          {top7Labels.map(({ label, count }) => (
                            <button
                              key={label}
                              onClick={() => {
                                if (filters.labels.includes(label)) {
                                  setFilters({
                                    ...filters,
                                    labels: filters.labels.filter((l) => l !== label),
                                  });
                                } else {
                                  setFilters({
                                    ...filters,
                                    labels: [...filters.labels, label],
                                  });
                                }
                              }}
                              className={`
                                px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap
                                transition-all duration-200 flex items-center gap-1.5
                                ${filters.labels.includes(label)
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                }
                              `}
                            >
                              {label}
                              <span className={`
                                text-[10px] px-1.5 py-0.5 rounded-full
                                ${filters.labels.includes(label)
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : "bg-background text-muted-foreground"
                                }
                              `}>
                                {count}
                              </span>
                            </button>
                          ))}
                          
                          {hasMore && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap
                                    bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground
                                    transition-all duration-200 flex items-center gap-1"
                                >
                                  +{remainingLabels.length} more
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
                                <div className="p-2">
                                  <div className="text-xs font-medium text-muted-foreground mb-2">
                                    All Labels ({sortedLabels.length})
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {sortedLabels.map(({ label, count }) => (
                                      <button
                                        key={label}
                                        onClick={() => {
                                          if (filters.labels.includes(label)) {
                                            setFilters({
                                              ...filters,
                                              labels: filters.labels.filter((l) => l !== label),
                                            });
                                          } else {
                                            setFilters({
                                              ...filters,
                                              labels: [...filters.labels, label],
                                            });
                                          }
                                        }}
                                        className={`
                                          px-2 py-1 text-xs rounded flex items-center gap-1
                                          ${filters.labels.includes(label)
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted hover:bg-muted/80"
                                          }
                                        `}
                                      >
                                        {label}
                                        <span className="text-[10px] opacity-70">({count})</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {issuesError && (
                  <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-red-600">{issuesError}</p>
                      </div>
                      <button
                        onClick={() => setIssuesError("")}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div id="issue-table-section">
                  <div className="space-y-6">
                    <IssueTable issues={filteredIssues} onIssueClick={handleIssueClick} />
                  </div>
                </div>

                {selectedIssue && (
                  <IssueDetailsModal
                    isOpen={isIssueModalOpen}
                    onClose={() => setIsIssueModalOpen(false)}
                    issueNumber={selectedIssue.number}
                    repository={selectedIssue.repository}
                    token={token}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
      {/* GitHub Connection Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              {connectionStep === "token" ? "Add GitHub profile" : "Select Repositories"}
            </DialogTitle>
            <DialogDescription>
              {connectionStep === "token"
                ? "Choose a unique profile name, then paste a Personal Access Token. The token is stored only for this profile."
                : `Select repositories to track (${dialogSelectedRepos.length} selected)`}
            </DialogDescription>
          </DialogHeader>
          
          {connectionStep === "token" ? (
            <div className="space-y-4 py-4">
              {tokenError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{tokenError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="profile-name">Profile name</Label>
                <Input
                  id="profile-name"
                  placeholder="e.g. Work, Client A"
                  value={connectionProfileName}
                  onChange={(e) => setConnectionProfileName(e.target.value)}
                  autoCapitalize="off"
                />
                <p className="text-xs text-muted-foreground">Unique per account — used to switch between tokens.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Personal Access Token</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Need a token? GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic) with &quot;repo&quot; and &quot;read:org&quot; so personal and organization repos appear. Organization owners may also need to approve third-party access for your org.
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Remember me on this device
                </Label>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col py-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={repoSearchQuery}
                  onChange={(e) => setRepoSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                <span>{filteredRepos.length} repositories</span>
                <div className="flex gap-2">
                  <button 
                    onClick={selectAllFilteredRepos}
                    className="hover:text-primary transition-colors"
                  >
                    Select all
                  </button>
                  <span>|</span>
                  <button 
                    onClick={deselectAllRepos}
                    className="hover:text-primary transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto border rounded-md">
                {isLoadingRepos ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading repositories...</span>
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Github className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No repositories found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredRepos.map((repo) => (
                      <label
                        key={repo.id}
                        className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={dialogSelectedRepos.includes(repo.full_name)}
                          onCheckedChange={() => toggleRepoSelection(repo.full_name)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{repo.full_name}</span>
                            {repo.private && (
                              <Badge variant="secondary" className="text-[10px] px-1.5">Private</Badge>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {repo.language && <span>{repo.language}</span>}
                            <span>⭐ {repo.stargazers_count}</span>
                            <span>Issues: {repo.open_issues_count}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-shrink-0">
            {connectionStep === "token" ? (
              <Button 
                onClick={handleTokenSubmit} 
                disabled={!githubToken.trim() || !connectionProfileName.trim() || isLoadingRepos}
                className="w-full sm:w-auto"
              >
                {isLoadingRepos ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setConnectionStep("token")}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleRepoSelectionComplete}
                  disabled={dialogSelectedRepos.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      Fetch Issues ({dialogSelectedRepos.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWidgetSettingsDialog} onOpenChange={setShowWidgetSettingsDialog}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Widget layout</DialogTitle>
            <DialogDescription>Show, hide, and reorder dashboard widgets.</DialogDescription>
          </DialogHeader>
          <WidgetSettingsPanel
            visibility={widgetVisibility}
            onVisibilityChange={handleVisibilityChange}
            widgetsPerRow={widgetsPerRow}
            onWidgetsPerRowChange={setWidgetsPerRow}
            widgetOrder={widgetOrder}
            onWidgetOrderChange={setWidgetOrder}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showReportSettingsDialog} onOpenChange={setShowReportSettingsDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report settings</DialogTitle>
            <DialogDescription>Customize PDF report appearance and branding.</DialogDescription>
          </DialogHeader>
          <ReportSettingsPanel
            config={reportConfig}
            onConfigChange={handleReportConfigChange}
            onClose={() => setShowReportSettingsDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showPdfExportDialog} onOpenChange={setShowPdfExportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Export PDF</DialogTitle>
            <DialogDescription>Generate a PDF from the current dashboard view.</DialogDescription>
          </DialogHeader>
          {showPdfExportDialog && (
            <LazyPDFExport disabled={filteredIssues.length === 0} reportConfig={reportConfig} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}