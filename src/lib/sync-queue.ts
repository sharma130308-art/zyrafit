// Offline write queue for food entries.
// Supports queued create/update/delete operations.
// Flushed automatically when the network returns or the page regains focus.
// Service worker also requests a flush via Background Sync where supported.

import { supabase } from "@/integrations/supabase/client";
import type { FoodEntry } from "./food-store";

const QUEUE_KEY = "zyrafit_sync_queue";
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
    }
  | {
      type: "delete";
      id: string;
      queuedAt: number;
    };

type Listener = (count: number) => void;
const listeners = new Set<Listener>();

function emit() {
  const n = getQueue().length;
  for (const l of listeners) l(n);
}

export function onQueueChange(fn: Listener): () => void {
  listeners.add(fn);
  fn(getQueue().length);
  return () => {
    listeners.delete(fn);
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

export function enqueueEntry(entry: Omit<FoodEntry, "id">, localId: string) {
  const q = getQueue();
  q.push({ type: "create", localId, queuedAt: Date.now(), payload: entry });
  setQueue(q);
  requestBackgroundSync();
}

export function enqueueUpdate(id: string, patch: Partial<Omit<FoodEntry, "id">>) {
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
  // Merge consecutive updates to the same id
  const lastIdx = q.length - 1;
  if (lastIdx >= 0 && q[lastIdx].type === "update" && q[lastIdx].id === id) {
    const last = q[lastIdx];
    if (last.type === "update") {
      last.payload = { ...last.payload, ...patch };
      setQueue(q);
      requestBackgroundSync();
      return;
    }
  }
  q.push({ type: "update", id, queuedAt: Date.now(), payload: patch });
  setQueue(q);
  requestBackgroundSync();
}

export function enqueueDelete(id: string) {
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
  q.push({ type: "delete", id, queuedAt: Date.now() });
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

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === "undefined") return { synced: 0, failed: 0 };
  if (flushing) return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) return { synced: 0, failed: 0 };

  flushing = true;
  let synced = 0;
  let failed = 0;
  const remaining: QueuedOp[] = [];
  // Track id remapping (create localId → server id) for downstream ops + cache
  const idMap: Record<string, string> = {};

  try {
    for (const op of queue) {
      try {
        if (op.type === "create") {
          const { data, error } = await supabase
            .from("food_entries")
            .insert(toInsertRow(op.payload, userId))
            .select()
            .single();
          if (error || !data) throw error || new Error("insert failed");
          idMap[op.localId] = data.id;
          synced++;
        } else if (op.type === "update") {
          const targetId = idMap[op.id] || op.id;
          const { error } = await supabase
            .from("food_entries")
            .update(toUpdateRow(op.payload))
            .eq("id", targetId);
          if (error) throw error;
          synced++;
        } else if (op.type === "delete") {
          const targetId = idMap[op.id] || op.id;
          const { error } = await supabase
            .from("food_entries")
            .delete()
            .eq("id", targetId);
          if (error) throw error;
          synced++;
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

  return { synced, failed };
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
