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

  const handleTokenConnect = async () => {
    if (!token.trim()) {
      setError("Please enter a valid token");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const { saveGitHubConnection } = await import("@/services/githubService");
      await saveGitHubConnection(token.trim());
      
      setToken("");
      setIsLoading(false);
      onOpenChange?.(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to store token. Please try again.");
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
            Enter your GitHub Personal Access Token to connect your repositories
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
      </DialogContent>
    </Dialog>
  );
}