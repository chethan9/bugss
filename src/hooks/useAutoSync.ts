import { useEffect, useRef, useState, useCallback } from "react";

interface UseAutoSyncProps {
  enabled: boolean;
  onSync: () => Promise<void>;
  intervalMs?: number; // Default: 15 minutes
}

export function useAutoSync({ enabled, onSync, intervalMs = 15 * 60 * 1000 }: UseAutoSyncProps) {
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [nextSyncAt, setNextSyncAt] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTabVisible = useRef(true);

  // Track tab visibility to pause syncing when inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisible.current = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const performSync = useCallback(async () => {
    // Skip if tab is not visible or already syncing
    if (!isTabVisible.current || isAutoSyncing) {
      return;
    }

    setIsAutoSyncing(true);
    try {
      await onSync();
      setNextSyncAt(new Date(Date.now() + intervalMs));
    } catch (error) {
      console.error("Auto-sync failed:", error);
      // Continue polling even if sync fails
      setNextSyncAt(new Date(Date.now() + intervalMs));
    } finally {
      setIsAutoSyncing(false);
    }
  }, [onSync, intervalMs, isAutoSyncing]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set up new interval if enabled
    if (enabled) {
      // Set initial next sync time
      setNextSyncAt(new Date(Date.now() + intervalMs));

      // Start polling
      intervalRef.current = setInterval(() => {
        performSync();
      }, intervalMs);

      // Cleanup on unmount or when disabled
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      setNextSyncAt(null);
    }
  }, [enabled, intervalMs, performSync]);

  return {
    isAutoSyncing,
    nextSyncAt,
  };
}