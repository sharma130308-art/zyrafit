// Scan debug logging.
//
// In DEV: keeps an in-memory + localStorage ring buffer that the developer
//   ScanDebugPanel can render (panel itself is also gated to dev-only).
// In PROD: console-only (still capturable by remote logging tools), never
//   writes to localStorage and never notifies UI listeners — so there is no
//   way for end users to see raw debug output.

export type ScanDebugEntry = {
  id: string;
  ts: number;
  step: string;
  status: "info" | "ok" | "error";
  detail?: string;
};

const KEY = "zyrafit:scan-debug";
const MAX = 30;
const IS_DEV = typeof import.meta !== "undefined" && !!import.meta.env?.DEV;

type Listener = (entries: ScanDebugEntry[]) => void;
const listeners = new Set<Listener>();

function read(): ScanDebugEntry[] {
  if (!IS_DEV) return [];
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScanDebugEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: ScanDebugEntry[]) {
  if (!IS_DEV) return;
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
  listeners.forEach((l) => l(entries));
}

export function logScan(step: string, status: ScanDebugEntry["status"] = "info", detail?: string) {
  const safeDetail = detail ? String(detail).slice(0, 800) : undefined;

  // Always console-log so remote log capture (and devtools in dev) sees it.
  // Use the matching console level so production log pipelines can filter
  // by severity. This is captured by remote logging — users don't see this
  // unless they open devtools.
  const fn =
    status === "error" ? console.error
    : status === "ok" ? console.info
    : console.log;
  // eslint-disable-next-line no-console
  fn(`[scan] ${step}`, safeDetail ?? "");

  if (!IS_DEV) return;

  const entry: ScanDebugEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    step,
    status,
    detail: safeDetail,
  };
  const next = [entry, ...read()].slice(0, MAX);
  write(next);
}

export function getScanDebug(): ScanDebugEntry[] {
  return read();
}

export function clearScanDebug() {
  write([]);
}

export function subscribeScanDebug(listener: Listener): () => void {
  listeners.add(listener);
  listener(read());
  return () => {
    listeners.delete(listener);
  };
}
