import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, X, Trash2, RefreshCw } from "lucide-react";
import { getQueue, onQueueChange, flushQueue, type QueuedOp } from "@/lib/sync-queue";

/**
 * Dev-only floating button that reveals the current sync queue contents.
 * Only renders in development mode (import.meta.env.DEV).
 */
export function SyncQueueDebugPanel() {
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState<QueuedOp[]>([]);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [flushing, setFlushing] = useState(false);

  useEffect(() => {
    setQueue(getQueue());
    const unsub = onQueueChange(() => setQueue(getQueue()));
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

  if (!import.meta.env.DEV) return null;

  const handleFlush = async () => {
    setFlushing(true);
    try {
      await flushQueue();
    } finally {
      setFlushing(false);
    }
  };

  const handleClear = () => {
    if (!confirm("Clear all pending sync operations? This cannot be undone.")) return;
    localStorage.removeItem("zyrafit_sync_queue");
    setQueue([]);
    // Trigger listeners
    window.dispatchEvent(new Event("storage"));
    location.reload();
  };

  return (
    <>
      {/* Floating toggle */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-3 z-[70] w-10 h-10 rounded-full bg-foreground/85 text-background shadow-lg flex items-center justify-center backdrop-blur-md"
        aria-label="Sync queue debug"
      >
        <Bug className="w-4 h-4" />
        {queue.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {queue.length}
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[68] bg-foreground/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-3 right-3 left-3 sm:left-auto sm:w-[360px] z-[69] bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden max-h-[70vh] flex flex-col"
              initial={{ y: 20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Dev · Sync queue
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[15px] font-semibold text-card-foreground">
                      {queue.length} {queue.length === 1 ? "operation" : "operations"}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        online
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {online ? "online" : "offline"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Queue list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {queue.length === 0 ? (
                  <div className="text-center py-8 text-[13px] text-muted-foreground">
                    Queue is empty 🎉
                  </div>
                ) : (
                  queue.map((op, i) => <QueueItem key={i} op={op} />)
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 p-3 border-t border-border/40">
                <button
                  onClick={handleFlush}
                  disabled={!online || flushing || queue.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${flushing ? "animate-spin" : ""}`} />
                  Flush now
                </button>
                <button
                  onClick={handleClear}
                  disabled={queue.length === 0}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-destructive/10 text-destructive text-[13px] font-semibold disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function QueueItem({ op }: { op: QueuedOp }) {
  const ageSec = Math.round((Date.now() - op.queuedAt) / 1000);
  const age =
    ageSec < 60
      ? `${ageSec}s ago`
      : ageSec < 3600
        ? `${Math.round(ageSec / 60)}m ago`
        : `${Math.round(ageSec / 3600)}h ago`;

  const typeColor =
    op.type === "create"
      ? "bg-success/15 text-success"
      : op.type === "update"
        ? "bg-primary/15 text-primary"
        : "bg-destructive/15 text-destructive";

  return (
    <div className="rounded-xl bg-muted/40 border border-border/30 p-2.5 text-[12px]">
      <div className="flex items-center justify-between mb-1">
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${typeColor}`}>
          {op.type}
        </span>
        <span className="text-[10px] text-muted-foreground">{age}</span>
      </div>
      {op.type === "create" && (
        <div className="space-y-0.5">
          <p className="font-medium text-card-foreground truncate">{op.payload.name}</p>
          <p className="text-muted-foreground text-[11px]">
            {op.payload.mealType} · {Math.round(op.payload.calories)} cal · ×{op.payload.quantity}
          </p>
          <p className="text-muted-foreground text-[10px] font-mono truncate">id: {op.localId}</p>
        </div>
      )}
      {op.type === "update" && (
        <div className="space-y-0.5">
          <p className="font-medium text-card-foreground text-[11px]">
            Fields: {Object.keys(op.payload).join(", ") || "(none)"}
          </p>
          <p className="text-muted-foreground text-[10px] font-mono truncate">id: {op.id}</p>
        </div>
      )}
      {op.type === "delete" && (
        <p className="text-muted-foreground text-[10px] font-mono truncate">id: {op.id}</p>
      )}
    </div>
  );
}
