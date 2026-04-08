import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Key, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GitHubConnectProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
}

export function GitHubConnect({ open, onOpenChange, onSuccess }: GitHubConnectProps) {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOAuthConnect = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/github/oauth-url");
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }
      
      // Redirect to GitHub OAuth
      window.location.href = data.url;
    } catch (err) {
      setError("Failed to initiate OAuth flow. Please try again.");
      setIsLoading(false);
    }
  };

  const handleTokenConnect = async () => {
    if (!token.trim()) {
      setError("Please enter a valid token");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/github/store-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        setError(data.error || "Failed to connect with token");
        setIsLoading(false);
        return;
      }
      
      setToken("");
      setIsLoading(false);
      onOpenChange?.(false);
      onSuccess();
    } catch (err) {
      setError("Failed to store token. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Connect to GitHub
          </DialogTitle>
          <DialogDescription>
            Choose how you want to connect your GitHub account
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="oauth" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="oauth">OAuth (Recommended)</TabsTrigger>
            <TabsTrigger value="token">Personal Token</TabsTrigger>
          </TabsList>

          <TabsContent value="oauth" className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Authorize this app to access your GitHub repositories and issues. You'll be redirected to GitHub to approve access.
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Read access to your repositories</li>
                <li>Read access to issues and pull requests</li>
                <li>Read your user profile information</li>
              </ul>
            </div>
            <Button onClick={handleOAuthConnect} disabled={isLoading} className="w-full gap-2">
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
              Authorize with GitHub
            </Button>
          </TabsContent>

          <TabsContent value="token" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Personal Access Token</Label>
                <Input 
                  id="token" 
                  type="password" 
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token} 
                  onChange={(e) => setToken(e.target.value)} 
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && handleTokenConnect()}
                />
                <p className="text-xs text-muted-foreground">
                  Create a token at{" "}
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo,read:user" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub Settings → Developer settings → Personal access tokens
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  Required scopes: <code className="rounded bg-muted px-1 py-0.5">repo</code>, <code className="rounded bg-muted px-1 py-0.5">read:user</code>
                </p>
              </div>
              <Button 
                onClick={handleTokenConnect} 
                disabled={isLoading || !token.trim()} 
                className="w-full gap-2"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                Connect with Token
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}