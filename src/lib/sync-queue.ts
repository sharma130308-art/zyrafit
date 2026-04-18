// Offline write queue for food entries.
// - Queued in localStorage so it survives reloads.
// - Flushed automatically when the network returns or the page regains focus.
// - Service worker also requests a flush via Background Sync where supported.

import { supabase } from "@/integrations/supabase/client";
import type { FoodEntry } from "./food-store";

const QUEUE_KEY = "zyrafit_sync_queue";
const SYNC_TAG = "zyrafit-sync-meals";

export interface QueuedEntry {
  // localId is the temporary id used in the UI before the server assigns one
  localId: string;
  queuedAt: number;
  payload: Omit<FoodEntry, "id">;
}

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

export function getQueue(): QueuedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setQueue(q: QueuedEntry[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  emit();
}

export function enqueueEntry(entry: Omit<FoodEntry, "id">, localId: string) {
  const q = getQueue();
  q.push({ localId, queuedAt: Date.now(), payload: entry });
  setQueue(q);
  requestBackgroundSync();
}

export function getQueuedCount(): number {
  return getQueue().length;
}

let flushing = false;

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
  const remaining: QueuedEntry[] = [];
  // Track id remapping so the local cache can be updated by callers
  const idMap: Record<string, string> = {};

  try {
    for (const item of queue) {
      const { payload } = item;
      const insertData: any = {
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
      if (payload.photoUrl) insertData.photo_url = payload.photoUrl;

      const { data, error } = await supabase
        .from("food_entries")
        .insert(insertData)
        .select()
        .single();

      if (error || !data) {
        failed++;
        remaining.push(item);
      } else {
        synced++;
        idMap[item.localId] = data.id;
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
      // ignore cache update failures
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
    // Silent — we still have the online listener fallback
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

  // Listen for SW asking us to flush (Background Sync hands work back to the page)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data?.type === "FLUSH_SYNC_QUEUE") tryFlush();
    });
  }

  // Initial attempt in case the app loaded already-online with a pending queue
  if (navigator.onLine) tryFlush();
}
