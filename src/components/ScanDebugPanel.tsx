import { useEffect, useState } from "react";
import { Bug, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  subscribeScanDebug,
  clearScanDebug,
  type ScanDebugEntry,
} from "@/lib/scan-debug";

const STORAGE_KEY = "zyrafit:scan-debug-visible";

export function ScanDebugPanel() {
  const [entries, setEntries] = useState<ScanDebugEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      setVisible(localStorage.getItem(STORAGE_KEY) === "1");
    }
    return subscribeScanDebug(setEntries);
  }, []);

  // Hidden global toggle: tap a key combo or set the flag from console.
  useEffect(() => {
    (window as unknown as { showScanDebug?: () => void }).showScanDebug = () => {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(true);
    };
    (window as unknown as { hideScanDebug?: () => void }).hideScanDebug = () => {
      localStorage.removeItem(STORAGE_KEY);
      setVisible(false);
    };
  }, []);

  if (!visible) {
    // Show a discreet floating bug button only if there are any entries OR user toggled it.
    if (entries.length === 0) return null;
  }

  return (
    <div className="fixed bottom-24 right-3 z-[60] max-w-[360px] w-[90vw]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-foreground text-background px-3 py-2 text-xs font-medium shadow-lg"
        >
          <Bug className="h-3.5 w-3.5" />
          Scan debug ({entries.length})
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      ) : (
        <div className="rounded-xl border bg-background/95 backdrop-blur shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Bug className="h-3.5 w-3.5" />
              Scan debug
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearScanDebug}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="Clear"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="Minimize"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  setVisible(false);
                  setOpen(false);
                }}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="Hide"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1">
            {entries.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground">
                No scan attempts logged yet.
              </div>
            ) : (
              entries.map((e) => (
                <div
                  key={e.id}
                  className="rounded-md border bg-card px-2 py-1.5 text-[11px] leading-snug"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{e.step}</span>
                    <span
                      className={
                        e.status === "error"
                          ? "text-destructive"
                          : e.status === "ok"
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }
                    >
                      {e.status}
                    </span>
                  </div>
                  <div className="text-muted-foreground tabular-nums">
                    {new Date(e.ts).toLocaleTimeString()}
                  </div>
                  {e.detail && (
                    <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] text-muted-foreground">
                      {e.detail}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">
            Tip: run <code>hideScanDebug()</code> in console to dismiss.
          </div>
        </div>
      )}
    </div>
  );
}
