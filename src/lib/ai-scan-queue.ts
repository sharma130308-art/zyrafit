// Offline queue for AI photo scans (food + body composition).
// Stores base64 images in IndexedDB (localStorage is too small for photos).
// On reconnect: replays each scan to the edge function, then either
// updates the placeholder food entry or inserts the body weight log.
// Retries 3× with exponential backoff per item, then surfaces a toast and drops.

import { supabase } from "@/integrations/supabase/client";
import { updateEntry, deleteEntry } from "./food-store";
import { toast } from "sonner";

const DB_NAME = "zyrafit_ai_queue";
const STORE = "scans";
const DB_VERSION = 1;
const MAX_ATTEMPTS = 3;

export type AIScanKind = "food" | "body";

export interface QueuedScan {
  id: string;
  kind: AIScanKind;
  imageBase64: string;
  // food-only:
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  date?: string;
  placeholderEntryId?: string;
  // bookkeeping:
  createdAt: number;
  attempts: number;
  lastError?: string;
  nextRetryAt?: number;
}

// ── IndexedDB plumbing ────────────────────────────────────────

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAll(): Promise<QueuedScan[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const all = await tx<QueuedScan[]>("readonly", (s) => s.getAll() as IDBRequest<QueuedScan[]>);
    return (all || []).sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

async function put(scan: QueuedScan) {
  await tx("readwrite", (s) => s.put(scan));
  emit();
}

async function remove(id: string) {
  await tx("readwrite", (s) => s.delete(id));
  emit();
}

// ── Listener API (for badges) ─────────────────────────────────

type Listener = (count: number) => void;
const listeners = new Set<Listener>();

async function emit() {
  const all = await getAll();
  for (const l of listeners) l(all.length);
}

export function onAIQueueChange(fn: Listener): () => void {
  listeners.add(fn);
  getAll().then((all) => fn(all.length));
  return () => {
    listeners.delete(fn);
  };
}

export async function getAIQueueCount(): Promise<number> {
  return (await getAll()).length;
}

// ── Public enqueue API ────────────────────────────────────────

export async function enqueueFoodScan(args: {
  imageBase64: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  date: string;
  placeholderEntryId: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await put({
    id,
    kind: "food",
    imageBase64: args.imageBase64,
    mealType: args.mealType,
    date: args.date,
    placeholderEntryId: args.placeholderEntryId,
    createdAt: Date.now(),
    attempts: 0,
  });
  scheduleFlush();
  return id;
}

export async function enqueueBodyScan(imageBase64: string): Promise<string> {
  const id = crypto.randomUUID();
  await put({
    id,
    kind: "body",
    imageBase64,
    createdAt: Date.now(),
    attempts: 0,
  });
  scheduleFlush();
  return id;
}

// ── Flush ─────────────────────────────────────────────────────

let flushing = false;
let flushTimer: number | undefined;

function scheduleFlush(delay = 0) {
  if (typeof window === "undefined") return;
  if (flushTimer) window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(() => {
    flushTimer = undefined;
    flushAIQueue().catch(() => {});
  }, delay);
}

export async function flushAIQueue(): Promise<{ synced: number; failed: number; deferred: number }> {
  if (typeof window === "undefined") return { synced: 0, failed: 0, deferred: 0 };
  if (flushing) return { synced: 0, failed: 0, deferred: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0, deferred: 0 };

  const items = await getAll();
  if (items.length === 0) return { synced: 0, failed: 0, deferred: 0 };

  flushing = true;
  let synced = 0;
  let failed = 0;
  let deferred = 0;
  let nextRetryDelay = Infinity;

  try {
    const now = Date.now();
    for (const item of items) {
      // Honor per-item backoff
      if (item.nextRetryAt && item.nextRetryAt > now) {
        deferred++;
        nextRetryDelay = Math.min(nextRetryDelay, item.nextRetryAt - now);
        continue;
      }

      try {
        if (item.kind === "food") {
          await processFoodScan(item);
        } else {
          await processBodyScan(item);
        }
        await remove(item.id);
        synced++;
      } catch (e) {
        const attempts = item.attempts + 1;
        const message = e instanceof Error ? e.message : "Sync failed";
        if (attempts >= MAX_ATTEMPTS) {
          // Give up — clean up placeholder & notify user
          if (item.kind === "food" && item.placeholderEntryId) {
            await deleteEntry(item.placeholderEntryId).catch(() => {});
          }
          await remove(item.id);
          failed++;
          toast.error(
            item.kind === "food"
              ? "Couldn't analyze photo after 3 tries"
              : "Couldn't read body scan after 3 tries",
            { description: message },
          );
        } else {
          // Backoff: 5s, 30s
          const backoff = attempts === 1 ? 5_000 : 30_000;
          await put({
            ...item,
            attempts,
            lastError: message,
            nextRetryAt: Date.now() + backoff,
          });
          deferred++;
          nextRetryDelay = Math.min(nextRetryDelay, backoff);
        }
      }
    }
  } finally {
    flushing = false;
  }

  // If items are deferred, schedule the next flush
  if (deferred > 0 && Number.isFinite(nextRetryDelay)) {
    scheduleFlush(nextRetryDelay + 100);
  }

  if (synced > 0) {
    toast.success(
      synced === 1
        ? "Photo analysis complete"
        : `${synced} pending scans synced`,
    );
  }

  return { synced, failed, deferred };
}

// ── Per-kind processors ───────────────────────────────────────

async function processFoodScan(item: QueuedScan) {
  const { data, error } = await supabase.functions.invoke("analyze-food", {
    body: { imageBase64: item.imageBase64 },
  });
  if (error) throw new Error(error.message || "Network error");
  if (data?.ok === false) throw new Error(data.error || "AI analysis failed");
  if (!data?.is_food || !Array.isArray(data?.items) || data.items.length === 0) {
    throw new Error("No food detected");
  }

  // Use the first detected item to update the placeholder entry.
  // (Multi-item splits are out of scope for the offline queue.)
  const first = data.items[0];
  if (item.placeholderEntryId) {
    await updateEntry(item.placeholderEntryId, {
      name: first.name || "Food",
      calories: Number(first.calories) || 0,
      protein: Number(first.protein) || 0,
      carbs: Number(first.carbs) || 0,
      fat: Number(first.fat) || 0,
    });
  }
}

async function processBodyScan(item: QueuedScan) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error("Not signed in");

  const { data, error } = await supabase.functions.invoke("scan-body-stats", {
    body: { imageBase64: item.imageBase64 },
  });
  if (error) throw new Error(error.message || "Network error");
  if (data?.ok === false) throw new Error(data.error || "AI analysis failed");
  if (!data?.found || !data?.weight_kg) throw new Error("No body stats found");

  const { error: insertError } = await supabase.from("weight_logs").insert({
    user_id: userId,
    weight_kg: data.weight_kg,
    logged_at: data.date || new Date().toISOString().slice(0, 10),
    bmi: data.bmi || null,
    body_fat_percent: data.body_fat_percent || null,
    body_fat_mass_kg: data.body_fat_mass_kg || null,
    height_m: data.height_m || null,
  });
  if (insertError) throw insertError;
}

// ── Lifecycle ─────────────────────────────────────────────────

let initialized = false;
export function initAIScanQueue() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const tryFlush = () => scheduleFlush(0);

  window.addEventListener("online", tryFlush);
  window.addEventListener("focus", tryFlush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tryFlush();
  });

  if (navigator.onLine) tryFlush();
}
