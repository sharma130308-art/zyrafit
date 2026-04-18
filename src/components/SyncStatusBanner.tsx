import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudOff, RefreshCw, Check, AlertCircle } from "lucide-react";
import { onQueueChange, flushQueue } from "@/lib/sync-queue";
import { hapticLight, hapticMedium } from "@/lib/haptics";

/**
 * Floating banner that appears when meals are queued offline.
 * Auto-hides briefly after a successful sync. Tap to manually retry.
 */
export function SyncStatusBanner() {
  const [count, setCount] = useState(0);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [justSynced, setJustSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onQueueChange((n) => {
      setCount((prev) => {
        if (prev > 0 && n === 0) {
          setJustSynced(true);
          setLastError(null);
          window.setTimeout(() => setJustSynced(false), 2200);
        }
        return n;
      });
    });
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      unsub();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const handleRetry = async () => {
    if (syncing) return;
    if (!online) {
      hapticLight();
      return;
    }
    hapticMedium();
    setSyncing(true);
    setLastError(null);
    try {
      const result = await flushQueue();
      if (result.failed > 0 && result.synced === 0) {
        setLastError(`Couldn't sync ${result.failed} item${result.failed > 1 ? "s" : ""}`);
        window.setTimeout(() => setLastError(null), 3500);
      }
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Sync failed");
      window.setTimeout(() => setLastError(null), 3500);
    } finally {
      setSyncing(false);
    }
  };

  const visible = count > 0 || justSynced;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100%-24px)]"
        >
          {justSynced ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success text-success-foreground shadow-lg text-sm font-medium">
              <Check className="w-4 h-4" />
              <span>Synced</span>
            </div>
          ) : (
            <motion.button
              onClick={handleRetry}
              disabled={syncing}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full backdrop-blur-md shadow-lg text-sm font-medium transition-colors ${
                lastError
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-foreground/90 text-background"
              }`}
            >
              {!online ? (
                <CloudOff className="w-4 h-4" />
              ) : lastError ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              )}
              <span className="text-[13px]">
                {!online
                  ? `${count} pending — offline`
                  : lastError
                    ? lastError
                    : syncing
                      ? "Syncing…"
                      : `${count} pending`}
              </span>
              {online && !syncing && (
                <span
                  className={`ml-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    lastError
                      ? "bg-destructive-foreground/20 text-destructive-foreground"
                      : "bg-background/15 text-background"
                  }`}
                >
                  {lastError ? "Try again" : "Retry"}
                </span>
              )}
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
