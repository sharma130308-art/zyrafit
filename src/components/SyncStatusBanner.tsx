import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudOff, RefreshCw, Check, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { onQueueChange, flushQueue, onConflictsChange, type SyncConflict } from "@/lib/sync-queue";
import { onAIQueueChange, flushAIQueue } from "@/lib/ai-scan-queue";
import { hapticLight, hapticMedium } from "@/lib/haptics";

/**
 * Floating banner that appears when meals OR AI scans are queued offline.
 * Auto-hides briefly after a successful sync. Tap to manually retry both queues.
 */
export function SyncStatusBanner() {
  const [mealCount, setMealCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [justSynced, setJustSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const total = mealCount + aiCount;

  useEffect(() => {
    const unsubMeals = onQueueChange((n) => {
      setMealCount((prev) => {
        // Treat overall queue going to 0 as "synced" pulse
        if (prev + aiCount > 0 && n + aiCount === 0) {
          setJustSynced(true);
          setLastError(null);
          window.setTimeout(() => setJustSynced(false), 2200);
        }
        return n;
      });
    });
    const unsubAI = onAIQueueChange((n) => {
      setAiCount((prev) => {
        if (prev + mealCount > 0 && n + mealCount === 0) {
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
      unsubMeals();
      unsubAI();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const [mealResult, aiResult] = await Promise.all([flushQueue(), flushAIQueue()]);
      const totalFailed = mealResult.failed + aiResult.failed;
      const totalSynced = mealResult.synced + aiResult.synced;
      if (totalFailed > 0 && totalSynced === 0) {
        setLastError(`Couldn't sync ${totalFailed} item${totalFailed > 1 ? "s" : ""}`);
        window.setTimeout(() => setLastError(null), 3500);
      }
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Sync failed");
      window.setTimeout(() => setLastError(null), 3500);
    } finally {
      setSyncing(false);
    }
  };

  const visible = total > 0 || justSynced;

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
              ) : aiCount > 0 ? (
                <Sparkles className={`w-4 h-4 ${syncing ? "animate-pulse" : ""}`} />
              ) : (
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              )}
              <span className="text-[13px]">
                {!online
                  ? `${total} pending — offline`
                  : lastError
                    ? lastError
                    : syncing
                      ? "Syncing…"
                      : aiCount > 0 && mealCount > 0
                        ? `${aiCount} scan${aiCount > 1 ? "s" : ""} · ${mealCount} meal${mealCount > 1 ? "s" : ""}`
                        : aiCount > 0
                          ? `${aiCount} scan${aiCount > 1 ? "s" : ""} pending`
                          : `${mealCount} pending`}
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
