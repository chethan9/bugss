import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Clock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SyncStatusProps {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  onSync: () => void;
  onManageRepos: () => void;
  autoSyncEnabled: boolean;
  onAutoSyncToggle: (enabled: boolean) => void;
  nextSyncAt: Date | null;
  isAutoSyncing: boolean;
}

export function SyncStatus({ 
  lastSyncTime, 
  isSyncing, 
  onSync, 
  onManageRepos,
  autoSyncEnabled,
  onAutoSyncToggle,
  nextSyncAt,
  isAutoSyncing
}: SyncStatusProps) {
  return (
    <div className="flex items-center gap-4">
      {lastSyncTime && (
        <Badge variant="secondary" className="gap-2">
          <Clock className="h-3 w-3" />
          Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
        </Badge>
      )}

      {autoSyncEnabled && nextSyncAt && !isSyncing && !isAutoSyncing && (
        <Badge variant="outline" className="gap-2">
          <Zap className="h-3 w-3 text-status-progress" />
          Next sync: {formatDistanceToNow(nextSyncAt, { addSuffix: true })}
        </Badge>
      )}

      <div className="flex items-center gap-2">
        <Switch
          id="auto-sync"
          checked={autoSyncEnabled}
          onCheckedChange={onAutoSyncToggle}
        />
        <Label htmlFor="auto-sync" className="text-sm cursor-pointer">
          Auto-sync (15min)
        </Label>
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onSync} 
        disabled={isSyncing || isAutoSyncing} 
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${(isSyncing || isAutoSyncing) ? "animate-spin" : ""}`} />
        {isSyncing || isAutoSyncing ? "Syncing..." : "Sync Now"}
      </Button>

      <Button variant="outline" size="sm" onClick={onManageRepos}>
        Manage Repositories
      </Button>
    </div>
  );
}