import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { supabase } from "@/integrations/supabase/client";
import { getUserSettings, saveUserSettings } from "@/services/userSettingsService";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Key, 
  Github, 
  Trash2, 
  Save, 
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
  Bug
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [githubToken, setGithubToken] = useState("");
  const [hasGithubToken, setHasGithubToken] = useState(false);
  const [isGithubOAuth, setIsGithubOAuth] = useState(false);
  
  // Branding settings
  const [appName, setAppName] = useState("FixFlix");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push("/auth");
          return;
        }
        
        setUser(session.user);
        setDisplayName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "");
        
        // Check if user logged in with GitHub OAuth
        const isOAuth = session.user.app_metadata?.provider === "github";
        setIsGithubOAuth(isOAuth);
        
        // Load settings to check for GitHub token and branding
        const settings = await getUserSettings(session.user.id);
        if (settings?.github_token) {
          setHasGithubToken(true);
        }
        if (settings?.app_name) {
          setAppName(settings.app_name);
        }
        if (settings?.logo_url) {
          setLogoUrl(settings.logo_url);
        }
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/auth");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName }
      });
      
      if (error) throw error;
      
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Password changed successfully" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to change password" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGithubToken = async () => {
    if (!user || !githubToken) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      await saveUserSettings(user.id, { github_token: githubToken });
      setHasGithubToken(true);
      setGithubToken("");
      setMessage({ type: "success", text: "GitHub token saved successfully" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to save GitHub token" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveGithubToken = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      await saveUserSettings(user.id, { github_token: null });
      setHasGithubToken(false);
      setMessage({ type: "success", text: "GitHub token removed" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to remove GitHub token" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      await saveUserSettings(user.id, { 
        app_name: appName,
        logo_url: logoUrl 
      });
      setMessage({ type: "success", text: "Branding updated successfully" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update branding" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Note: Account deletion requires admin API or Edge Function
    setMessage({ type: "error", text: "Please contact support to delete your account" });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Profile - FixFlix" description="Manage your account settings" />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-6 w-6 text-primary" />
              </div>
              Profile Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and linked accounts
            </p>
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-6">
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your account details and display name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                  />
                </div>
                
                <Button onClick={handleUpdateProfile} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Password Change - Only for email users */}
            {!isGithubOAuth && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isSaving || !newPassword || !confirmPassword}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {isSaving ? "Changing..." : "Change Password"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Linked Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Linked Accounts
                </CardTitle>
                <CardDescription>
                  Connect external services to enhance your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* GitHub OAuth Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Github className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">GitHub Account</p>
                      <p className="text-sm text-muted-foreground">
                        {isGithubOAuth ? "Signed in with GitHub OAuth" : "Not connected via OAuth"}
                      </p>
                    </div>
                  </div>
                  {isGithubOAuth && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* GitHub Personal Access Token */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">GitHub Personal Access Token</p>
                      <p className="text-sm text-muted-foreground">
                        Required to access private repositories
                      </p>
                    </div>
                    {hasGithubToken && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Saved
                      </Badge>
                    )}
                  </div>
                  
                  {hasGithubToken ? (
                    <div className="flex items-center gap-2">
                      <Input value="••••••••••••••••" disabled className="bg-muted flex-1" />
                      <Button variant="destructive" size="sm" onClick={handleRemoveGithubToken}>
                        <Unlink className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="flex-1"
                      />
                      <Button onClick={handleSaveGithubToken} disabled={!githubToken || isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Create a token at{" "}
                    <a 
                      href="https://github.com/settings/tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      GitHub Settings → Developer settings → Personal access tokens
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Branding Customization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Branding Customization
                </CardTitle>
                <CardDescription>
                  Customize the app name and logo for your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">App Name</Label>
                  <Input
                    id="appName"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="FixFlix"
                  />
                  <p className="text-xs text-muted-foreground">
                    The name displayed in the header and login page
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Custom Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl || ""}
                    onChange={(e) => setLogoUrl(e.target.value || null)}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the default bug icon. Recommended size: 32x32px
                  </p>
                </div>
                
                {logoUrl && (
                  <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Preview:</span>
                    <img 
                      src={logoUrl} 
                      alt="Logo preview" 
                      className="h-8 w-8 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span className="font-bold">{appName}</span>
                  </div>
                )}
                
                <Button onClick={handleSaveBranding} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Branding"}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}