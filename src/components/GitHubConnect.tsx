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
import { Github, Key, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GitHubConnectProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
}

export function GitHubConnect({ open, onOpenChange, onSuccess }: GitHubConnectProps) {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuthConnect = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 1500);
  };

  const handleTokenConnect = () => {
    if (!token.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setToken("");
      onSuccess();
    }, 1500);
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
                <Input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} disabled={isLoading} />
              </div>
              <Button onClick={handleTokenConnect} disabled={isLoading || !token.trim()} className="w-full gap-2">
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