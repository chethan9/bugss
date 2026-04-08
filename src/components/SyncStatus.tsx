import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SyncStatusProps {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  onSync: () => void;
  onManageRepos: () => void;
}

export function SyncStatus({ lastSyncTime, isSyncing, onSync, onManageRepos }: SyncStatusProps) {
  return (
    <div className="flex items-center gap-3">
      {lastSyncTime && (
        <Badge variant="secondary" className="gap-2">
          <Clock className="h-3 w-3" />
          Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
        </Badge>
      )}

      <Button variant="outline" size="sm" onClick={onSync} disabled={isSyncing} className="gap-2">
        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Syncing..." : "Sync Now"}
      </Button>

      <Button variant="outline" size="sm" onClick={onManageRepos}>
        Manage Repositories
      </Button>
    </div>
  );
}