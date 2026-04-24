// Tiny in-memory + localStorage debug log for the AI photo scan flow.
// Lets the user see exactly what happened on the last scan attempt(s).

export type ScanDebugEntry = {
  id: string;
  ts: number;
  step: string;
  status: "info" | "ok" | "error";
  detail?: string;
};

const KEY = "zyrafit:scan-debug";
const MAX = 30;
type Listener = (entries: ScanDebugEntry[]) => void;
const listeners = new Set<Listener>();

function read(): ScanDebugEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScanDebugEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: ScanDebugEntry[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
  listeners.forEach((l) => l(entries));
}

export function logScan(step: string, status: ScanDebugEntry["status"] = "info", detail?: string) {
  const entry: ScanDebugEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    step,
    status,
    detail: detail ? String(detail).slice(0, 800) : undefined,
  };
  // eslint-disable-next-line no-console
  console.log(`[scan-debug] ${step}`, status, detail ?? "");
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
