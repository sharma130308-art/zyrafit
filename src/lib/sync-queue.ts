// Offline write queue for food entries.
// Supports queued create/update/delete operations with optimistic concurrency
// control (OCC) via `baseUpdatedAt` snapshots. When the server's `updated_at`
// is newer than the snapshot captured at queue time, we record a conflict and
// apply a deterministic "client-wins" resolution (since the queued op is the
// user's explicit intent), while keeping an audit trail for the UI.

import { supabase } from "@/integrations/supabase/client";
import type { FoodEntry } from "./food-store";

const QUEUE_KEY = "zyrafit_sync_queue";
const CONFLICT_KEY = "zyrafit_sync_conflicts";
const SYNC_TAG = "zyrafit-sync-meals";

export type QueuedOp =
  | {
      type: "create";
      localId: string;
      queuedAt: number;
      payload: Omit<FoodEntry, "id">;
    }
  | {
      type: "update";
      id: string;
      queuedAt: number;
      payload: Partial<Omit<FoodEntry, "id">>;
      /** Server `updated_at` known at queue time (ISO). Used for OCC. */
      baseUpdatedAt?: string | null;
      /** Full entry snapshot used to resurrect rows deleted server-side. */
      snapshot?: FoodEntry;
    }
  | {
      type: "delete";
      id: string;
      queuedAt: number;
      baseUpdatedAt?: string | null;
    };

export type SyncConflict = {
  kind: "update-vs-newer-server" | "update-on-deleted" | "delete-vs-newer-server";
  id: string;
  /** Op type that triggered the conflict, for the UI. */
  opType: "update" | "delete";
  /** Resolution that was applied. */
  resolution: "client-wins" | "resurrected" | "deleted-anyway";
  baseUpdatedAt: string | null;
  serverUpdatedAt: string | null;
  resolvedAt: number;
  /** Best-effort human label (entry name) for the toast/UI. */
  label?: string;
};

type Listener = (count: number) => void;
type ConflictListener = (conflicts: SyncConflict[]) => void;
const listeners = new Set<Listener>();
const conflictListeners = new Set<ConflictListener>();

function emit() {
  const n = getQueue().length;
  for (const l of listeners) l(n);
}

function emitConflicts() {
  const c = getConflicts();
  for (const l of conflictListeners) l(c);
}

export function onQueueChange(fn: Listener): () => void {
  listeners.add(fn);
  fn(getQueue().length);
  return () => {
    listeners.delete(fn);
  };
}

export function onConflictsChange(fn: ConflictListener): () => void {
  conflictListeners.add(fn);
  fn(getConflicts());
  return () => {
    conflictListeners.delete(fn);
  };
}

export function getQueue(): QueuedOp[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setQueue(q: QueuedOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  emit();
}

export function getConflicts(): SyncConflict[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CONFLICT_KEY) || "[]");
  } catch {
    return [];
  }
}

function pushConflict(c: SyncConflict) {
  const list = getConflicts();
  // Keep the most recent 50.
  list.unshift(c);
  localStorage.setItem(CONFLICT_KEY, JSON.stringify(list.slice(0, 50)));
  emitConflicts();
}

export function clearConflicts() {
  localStorage.setItem(CONFLICT_KEY, "[]");
  emitConflicts();
}

export function enqueueEntry(entry: Omit<FoodEntry, "id">, localId: string) {
  const q = getQueue();
  q.push({ type: "create", localId, queuedAt: Date.now(), payload: entry });
  setQueue(q);
  requestBackgroundSync();
}

export function enqueueUpdate(
  id: string,
  patch: Partial<Omit<FoodEntry, "id">>,
  meta?: { baseUpdatedAt?: string | null; snapshot?: FoodEntry },
) {
  const q = getQueue();
  // Collapse: if a create for this localId is queued, merge the patch into it.
  const createIdx = q.findIndex((op) => op.type === "create" && op.localId === id);
  if (createIdx >= 0 && q[createIdx].type === "create") {
    const existing = q[createIdx];
    if (existing.type === "create") {
      existing.payload = { ...existing.payload, ...patch } as Omit<FoodEntry, "id">;
      setQueue(q);
      requestBackgroundSync();
      return;
    }
  }
  // Merge consecutive updates to the same id (keep the OLDEST baseUpdatedAt so
  // we still detect concurrent server edits made before any of the queued ops).
  const lastIdx = q.length - 1;
  if (lastIdx >= 0 && q[lastIdx].type === "update" && q[lastIdx].id === id) {
    const last = q[lastIdx];
    if (last.type === "update") {
      last.payload = { ...last.payload, ...patch };
      if (meta?.snapshot) last.snapshot = meta.snapshot;
      // baseUpdatedAt: keep the existing one (older snapshot wins for OCC).
      setQueue(q);
      requestBackgroundSync();
      return;
    }
  }
  q.push({
    type: "update",
    id,
    queuedAt: Date.now(),
    payload: patch,
    baseUpdatedAt: meta?.baseUpdatedAt ?? null,
    snapshot: meta?.snapshot,
  });
  setQueue(q);
  requestBackgroundSync();
}

export function enqueueDelete(
  id: string,
  meta?: { baseUpdatedAt?: string | null },
) {
  let q = getQueue();
  // If there's a queued create for this localId, just drop it (and any updates).
  const hadPendingCreate = q.some((op) => op.type === "create" && op.localId === id);
  if (hadPendingCreate) {
    q = q.filter(
      (op) =>
        !(op.type === "create" && op.localId === id) &&
        !(op.type === "update" && op.id === id),
    );
    setQueue(q);
    return;
  }
  // Drop pending updates for this id, then push delete
  q = q.filter((op) => !(op.type === "update" && op.id === id));
  q.push({
    type: "delete",
    id,
    queuedAt: Date.now(),
    baseUpdatedAt: meta?.baseUpdatedAt ?? null,
  });
  setQueue(q);
  requestBackgroundSync();
}

export function getQueuedCount(): number {
  return getQueue().length;
}

let flushing = false;

function toInsertRow(payload: Omit<FoodEntry, "id">, userId: string) {
  const row: any = {
    user_id: userId,
    name: payload.name,
    calories: payload.calories,
    protein: payload.protein,
    carbs: payload.carbs,
    fat: payload.fat,
    quantity: payload.quantity,
    meal_type: payload.mealType,
    date: payload.date,
    barcode: payload.barcode || null,
    source: payload.source || "manual",
  };
  if (payload.photoUrl) row.photo_url = payload.photoUrl;
  return row;
}

function toUpdateRow(patch: Partial<Omit<FoodEntry, "id">>) {
  const row: any = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.calories !== undefined) row.calories = patch.calories;
  if (patch.protein !== undefined) row.protein = patch.protein;
  if (patch.carbs !== undefined) row.carbs = patch.carbs;
  if (patch.fat !== undefined) row.fat = patch.fat;
  if (patch.quantity !== undefined) row.quantity = patch.quantity;
  if (patch.mealType !== undefined) row.meal_type = patch.mealType;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.barcode !== undefined) row.barcode = patch.barcode || null;
  if (patch.source !== undefined) row.source = patch.source;
  if (patch.photoUrl !== undefined) row.photo_url = patch.photoUrl || null;
  return row;
}

function isNewer(server: string | null | undefined, base: string | null | undefined): boolean {
  if (!server) return false;
  if (!base) return true; // we never had a baseline → treat any server row as newer
  return new Date(server).getTime() > new Date(base).getTime();
}

export async function flushQueue(): Promise<{ synced: number; failed: number; conflicts: number }> {
  if (typeof window === "undefined") return { synced: 0, failed: 0, conflicts: 0 };
  if (flushing) return { synced: 0, failed: 0, conflicts: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0, conflicts: 0 };

  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0, conflicts: 0 };

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) return { synced: 0, failed: 0, conflicts: 0 };

  flushing = true;
  let synced = 0;
  let failed = 0;
  let conflicts = 0;
  const remaining: QueuedOp[] = [];
  const idMap: Record<string, string> = {};
  // Cache the freshly-written updated_at per id so later ops in the same flush
  // don't false-positive on their own writes.
  const localBaseline: Record<string, string | null> = {};

  try {
    for (const op of queue) {
      try {
        if (op.type === "create") {
          const { data, error } = await supabase
            .from("food_entries")
            .insert(toInsertRow(op.payload, userId))
            .select("id, updated_at")
            .single();
          if (error || !data) throw error || new Error("insert failed");
          idMap[op.localId] = data.id;
          localBaseline[data.id] = (data as any).updated_at || null;
          synced++;
        } else if (op.type === "update") {
          const targetId = idMap[op.id] || op.id;

          // OCC: read current server updated_at first.
          const { data: current } = await supabase
            .from("food_entries")
            .select("id, updated_at, name")
            .eq("id", targetId)
            .maybeSingle();

          const baseline = localBaseline[targetId] ?? op.baseUpdatedAt ?? null;

          if (!current) {
            // Row was deleted server-side while we were offline.
            if (op.snapshot) {
              // Resurrect: re-insert with the latest local state.
              const { snapshot } = op;
              const insertRow = toInsertRow(
                { ...snapshot, ...op.payload } as Omit<FoodEntry, "id">,
                userId,
              );
              insertRow.id = targetId; // preserve client id so cache stays stable
              const { data: ins, error: insErr } = await supabase
                .from("food_entries")
                .insert(insertRow)
                .select("id, updated_at")
                .single();
              if (insErr || !ins) throw insErr || new Error("resurrect failed");
              localBaseline[ins.id] = (ins as any).updated_at || null;
              pushConflict({
                kind: "update-on-deleted",
                id: targetId,
                opType: "update",
                resolution: "resurrected",
                baseUpdatedAt: baseline,
                serverUpdatedAt: null,
                resolvedAt: Date.now(),
                label: op.snapshot.name,
              });
              conflicts++;
              synced++;
            } else {
              // No snapshot — can't resurrect; treat as success (best effort).
              synced++;
            }
          } else {
            const serverUpdatedAt = (current as any).updated_at as string | null;
            const conflict = isNewer(serverUpdatedAt, baseline);
            const { data: upd, error } = await supabase
              .from("food_entries")
              .update(toUpdateRow(op.payload))
              .eq("id", targetId)
              .select("id, updated_at")
              .single();
            if (error) throw error;
            localBaseline[targetId] = (upd as any)?.updated_at || null;
            if (conflict) {
              pushConflict({
                kind: "update-vs-newer-server",
                id: targetId,
                opType: "update",
                resolution: "client-wins",
                baseUpdatedAt: baseline,
                serverUpdatedAt,
                resolvedAt: Date.now(),
                label: (current as any).name,
              });
              conflicts++;
            }
            synced++;
          }
        } else if (op.type === "delete") {
          const targetId = idMap[op.id] || op.id;
          const { data: current } = await supabase
            .from("food_entries")
            .select("id, updated_at, name")
            .eq("id", targetId)
            .maybeSingle();

          if (!current) {
            // Already gone — nothing to do.
            synced++;
          } else {
            const serverUpdatedAt = (current as any).updated_at as string | null;
            const baseline = localBaseline[targetId] ?? op.baseUpdatedAt ?? null;
            const conflict = isNewer(serverUpdatedAt, baseline);
            const { error } = await supabase
              .from("food_entries")
              .delete()
              .eq("id", targetId);
            if (error) throw error;
            if (conflict) {
              pushConflict({
                kind: "delete-vs-newer-server",
                id: targetId,
                opType: "delete",
                resolution: "deleted-anyway",
                baseUpdatedAt: baseline,
                serverUpdatedAt,
                resolvedAt: Date.now(),
                label: (current as any).name,
              });
              conflicts++;
            }
            synced++;
          }
        }
      } catch {
        failed++;
        remaining.push(op);
      }
    }
  } finally {
    setQueue(remaining);
    flushing = false;
  }

  // Update cached entries with new server ids
  if (Object.keys(idMap).length > 0) {
    try {
      const cached = JSON.parse(localStorage.getItem("zyrafit_entries") || "[]");
      const updated = cached.map((e: FoodEntry) =>
        idMap[e.id] ? { ...e, id: idMap[e.id] } : e,
      );
      localStorage.setItem("zyrafit_entries", JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  return { synced, failed, conflicts };
}

async function requestBackgroundSync() {
  try {
    if (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      "SyncManager" in window
    ) {
      const reg = await navigator.serviceWorker.ready;
      // @ts-expect-error sync is not in lib.dom for all TS targets
      await reg.sync?.register(SYNC_TAG);
    }
  } catch {
    // Silent — online listener fallback handles it
  }
}

let initialized = false;
export function initSyncQueue() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const tryFlush = () => {
    flushQueue().catch(() => {});
  };

  window.addEventListener("online", tryFlush);
  window.addEventListener("focus", tryFlush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tryFlush();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data?.type === "FLUSH_SYNC_QUEUE") tryFlush();
    });
  }

  if (navigator.onLine) tryFlush();
}
