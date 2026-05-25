import { useEffect, useMemo, useState } from "react";
import { Bug, Trash2, X, ChevronDown, ChevronUp, Info } from "lucide-react";
import {
  subscribeScanDebug,
  clearScanDebug,
  type ScanDebugEntry,
} from "@/lib/scan-debug";

/**
 * Inspect recent debug entries and, if they look like a CORS / preflight /
 * network-layer failure, return a human-readable hint. Returns null when the
 * log doesn't match a known pattern so we don't show noise.
 */
function diagnoseEntries(entries: ScanDebugEntry[]): {
  title: string;
  causes: string[];
  next: string[];
} | null {
  if (entries.length === 0) return null;
  const recent = entries.slice(0, 8);
  const blob = recent
    .map((e) => `${e.step} ${e.status} ${e.detail ?? ""}`)
    .join("\n")
    .toLowerCase();

  const hasNetworkErr =
    blob.includes("failed to fetch") ||
    blob.includes("network error") ||
    blob.includes("networkerror") ||
    blob.includes("load failed") ||
    blob.includes("failed to send a request") ||
    blob.includes("direct fetch network error") ||
    blob.includes("invoke threw");

  const hasCors =
    blob.includes("cors") ||
    blob.includes("preflight") ||
    blob.includes("access-control") ||
    blob.includes("blocked by");

  const httpStatusMatch = blob.match(/responded (\d{3})|http error.*?(\d{3})/);
  const status = httpStatusMatch
    ? Number(httpStatusMatch[1] || httpStatusMatch[2])
    : null;

  if (status === 401 || status === 403) {
    return {
      title: "Auth rejected by the AI service",
      causes: [
        "Your session token is missing or expired.",
        "The edge function is requiring a signed-in user.",
      ],
      next: [
        "Sign out and sign back in, then retry the scan.",
        "Confirm the Scan debug shows an auth session before invoke.",
      ],
    };
  }

  if (status === 413 || blob.includes("payload too large")) {
    return {
      title: "Photo too large for the AI service",
      causes: [
        "The image is bigger than the 5 MB edge function limit.",
        "Downscale step may have failed on this device.",
      ],
      next: [
        "Try a different photo or retake at lower resolution.",
        "Check the 'downscale ok' line — size should be < 1500 KB.",
      ],
    };
  }

  if (hasCors || (hasNetworkErr && !status)) {
    return {
      title: "Request blocked before reaching the AI service",
      causes: [
        "Browser blocked the CORS preflight (OPTIONS) — common in embedded previews and strict corporate networks.",
        "The edge function URL is unreachable from this network (VPN, firewall, or offline).",
        "A browser extension (ad/privacy blocker) is intercepting the request.",
      ],
      next: [
        "Open the published app URL in a normal tab and retry — the preview iframe is the most common culprit.",
        "Disable ad/privacy extensions for this site, or try a private window.",
        "Switch network (e.g. off VPN / off corporate Wi‑Fi) and retry.",
        "In DevTools → Network, look for the failed POST to /functions/v1/analyze-food and check its Status / CORS columns.",
      ],
    };
  }

  return null;
}

const STORAGE_KEY = "zyrafit:scan-debug-visible";

export function ScanDebugPanel() {
  const [entries, setEntries] = useState<ScanDebugEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  // Hard kill-switch in production: never render the debug panel UI for end users.
  const isDev = !!import.meta.env?.DEV;

  const hint = useMemo(() => diagnoseEntries(entries), [entries]);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      setVisible(localStorage.getItem(STORAGE_KEY) === "1");
    }
    return subscribeScanDebug(setEntries);
  }, []);

  // Hidden global toggle: only exposed in development builds to avoid leaking
  // internal AI service URLs / function names via window.* in production.
  useEffect(() => {
    if (!import.meta.env?.DEV) return;
    (window as unknown as { showScanDebug?: () => void }).showScanDebug = () => {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(true);
    };
    (window as unknown as { hideScanDebug?: () => void }).hideScanDebug = () => {
      localStorage.removeItem(STORAGE_KEY);
      setVisible(false);
    };
  }, []);


  if (!isDev) return null;

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
          {hint && (
            <span
              className="inline-block h-2 w-2 rounded-full bg-amber-400"
              aria-label="Diagnostic hint available"
            />
          )}
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
          {hint && !hintDismissed && (
            <div className="border-b bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-[11px] leading-snug">
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-amber-900 dark:text-amber-200">
                    {hint.title}
                  </div>
                  <div className="mt-1 text-amber-900/80 dark:text-amber-200/80">
                    Likely causes:
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                      {hint.causes.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-1.5 text-amber-900/80 dark:text-amber-200/80">
                    Try next:
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                      {hint.next.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => setHintDismissed(true)}
                  className="rounded p-0.5 text-amber-700/70 hover:bg-amber-100 dark:hover:bg-amber-900"
                  aria-label="Dismiss hint"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
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
