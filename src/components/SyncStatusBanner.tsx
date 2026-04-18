import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudOff, RefreshCw, Check } from "lucide-react";
import { onQueueChange, flushQueue } from "@/lib/sync-queue";

/**
 * Floating banner that appears when meals are queued offline.
 * Auto-hides briefly after a successful sync.
 */
export function SyncStatusBanner() {
  const [count, setCount] = useState(0);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [justSynced, setJustSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsub = onQueueChange((n) => {
      setCount((prev) => {
        if (prev > 0 && n === 0) {
          setJustSynced(true);
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
    setSyncing(true);
    try {
      await flushQueue();
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
            <button
              onClick={handleRetry}
              disabled={!online || syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/90 backdrop-blur-md text-background shadow-lg text-sm font-medium disabled:opacity-80"
            >
              {!online ? (
                <CloudOff className="w-4 h-4" />
              ) : (
                <RefreshCw
                  className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                />
              )}
              <span>
                {!online
                  ? `${count} meal${count > 1 ? "s" : ""} pending — offline`
                  : syncing
                    ? "Syncing…"
                    : `${count} pending — tap to sync`}
              </span>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
