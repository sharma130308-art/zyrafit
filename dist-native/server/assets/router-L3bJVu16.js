import { jsx, jsxs } from "react/jsx-runtime";
import { useRouter, useLocation, createRootRoute, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CloudOff, AlertCircle, Sparkles, RefreshCw, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { defineTool, withMcpAuth, createMcpServer } from "mcp-tanstack-start";
import { z } from "zod";
function brokeredPreviewStorage() {
  if (typeof window === "undefined") return void 0;
  const host = location.hostname;
  const PREVIEW_ZONES = ["lovableproject.com", "lovableproject-dev.com", "lovable.app", "gpt-eng.com", "gptengineer.run"];
  const onPreviewZone = PREVIEW_ZONES.some((z2) => host === z2 || host.endsWith("." + z2));
  const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  const projectId = onPreviewZone ? host.match(new RegExp("^(?:id-preview(?:-[a-z0-9]+)?|project)--(" + UUID + ")(?:-dev)?(?=\\.|$)", "i"))?.[1] ?? host.match(new RegExp("^(" + UUID + ")(?=[.-])", "i"))?.[1] : void 0;
  const framed = window.parent && window.parent !== window;
  if (!projectId || !framed) return localStorage;
  const dev = host.endsWith(".lovableproject-dev.com") || host.endsWith(".gpt-eng.com");
  const EDITOR = dev ? /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$|^http:\/\/localhost:3000$/ : /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$/;
  const ancestor = location.ancestorOrigins && location.ancestorOrigins[0] || (document.referrer ? new URL(document.referrer).origin : "");
  const editorOrigins = ancestor && EDITOR.test(ancestor) ? [ancestor] : dev ? ["https://lovable.dev", "http://localhost:3000"] : ["https://lovable.dev"];
  const RESULT = "lovable-preview-auth:result";
  const TIMEOUT = 2e3;
  const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const request = (type, key, value) => new Promise((resolve) => {
    const requestId = newId();
    let done = false;
    let timer;
    const finish = (r) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(r);
    };
    const onMessage = (e) => {
      if (editorOrigins.indexOf(e.origin) < 0) return;
      const d = e.data;
      if (d && d.type === RESULT && d.requestId === requestId) finish(d);
    };
    window.addEventListener("message", onMessage);
    const msg = { type, requestId, projectId, key };
    if (value !== void 0) msg["value"] = value;
    for (const origin of editorOrigins) window.parent.postMessage(msg, origin);
    timer = setTimeout(() => finish(null), TIMEOUT);
  });
  let firstGet = true;
  const RETRY_DELAY = 250;
  return {
    getItem: async (key) => {
      let res = await request("lovable-preview-auth:get", key);
      if (!res && firstGet) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        res = await request("lovable-preview-auth:get", key);
      }
      firstGet = false;
      if (res && res.ok && typeof res.value === "string") {
        if (res.value === "") {
          localStorage.removeItem(key);
          return null;
        }
        return res.value;
      }
      return localStorage.getItem(key);
    },
    setItem: (key, value) => {
      localStorage.setItem(key, value);
      return request("lovable-preview-auth:set", key, value).then(() => void 0);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
      return request("lovable-preview-auth:remove", key).then(() => void 0);
    }
  };
}
function createSupabaseClient() {
  const SUPABASE_URL = "https://kmoxjqrkcdrwvqnlyalf.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb3hqcXJrY2Ryd3Zxbmx5YWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDIxODcsImV4cCI6MjA5MTQxODE4N30.i0WpkG3XEZ_A8VqHcejlB19WJx7ZJ7XfFluKg_ttr38";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
const QUEUE_KEY = "zyrafit_sync_queue";
const CONFLICT_KEY = "zyrafit_sync_conflicts";
const SYNC_TAG = "zyrafit-sync-meals";
const listeners$1 = /* @__PURE__ */ new Set();
const conflictListeners = /* @__PURE__ */ new Set();
function emit$1() {
  const n = getQueue().length;
  for (const l of listeners$1) l(n);
}
function emitConflicts() {
  const c = getConflicts();
  for (const l of conflictListeners) l(c);
}
function onQueueChange(fn) {
  listeners$1.add(fn);
  fn(getQueue().length);
  return () => {
    listeners$1.delete(fn);
  };
}
function onConflictsChange(fn) {
  conflictListeners.add(fn);
  fn(getConflicts());
  return () => {
    conflictListeners.delete(fn);
  };
}
function getQueue() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}
function setQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  emit$1();
}
function getConflicts() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CONFLICT_KEY) || "[]");
  } catch {
    return [];
  }
}
function pushConflict(c) {
  const list = getConflicts();
  list.unshift(c);
  localStorage.setItem(CONFLICT_KEY, JSON.stringify(list.slice(0, 50)));
  emitConflicts();
}
function enqueueEntry(entry, localId) {
  const q = getQueue();
  q.push({ type: "create", localId, queuedAt: Date.now(), payload: entry });
  setQueue(q);
  requestBackgroundSync();
}
function enqueueUpdate(id, patch, meta) {
  const q = getQueue();
  const createIdx = q.findIndex((op) => op.type === "create" && op.localId === id);
  if (createIdx >= 0 && q[createIdx].type === "create") {
    const existing = q[createIdx];
    if (existing.type === "create") {
      existing.payload = { ...existing.payload, ...patch };
      setQueue(q);
      requestBackgroundSync();
      return;
    }
  }
  const lastIdx = q.length - 1;
  if (lastIdx >= 0 && q[lastIdx].type === "update" && q[lastIdx].id === id) {
    const last = q[lastIdx];
    if (last.type === "update") {
      last.payload = { ...last.payload, ...patch };
      if (meta?.snapshot) last.snapshot = meta.snapshot;
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
    snapshot: meta?.snapshot
  });
  setQueue(q);
  requestBackgroundSync();
}
function enqueueDelete(id, meta) {
  let q = getQueue();
  const hadPendingCreate = q.some((op) => op.type === "create" && op.localId === id);
  if (hadPendingCreate) {
    q = q.filter(
      (op) => !(op.type === "create" && op.localId === id) && !(op.type === "update" && op.id === id)
    );
    setQueue(q);
    return;
  }
  q = q.filter((op) => !(op.type === "update" && op.id === id));
  q.push({
    type: "delete",
    id,
    queuedAt: Date.now(),
    baseUpdatedAt: meta?.baseUpdatedAt ?? null
  });
  setQueue(q);
  requestBackgroundSync();
}
let flushing$1 = false;
function toInsertRow(payload, userId) {
  const row = {
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
    source: payload.source || "manual"
  };
  if (payload.photoUrl) row.photo_url = payload.photoUrl;
  return row;
}
function toUpdateRow(patch) {
  const row = {};
  if (patch.name !== void 0) row.name = patch.name;
  if (patch.calories !== void 0) row.calories = patch.calories;
  if (patch.protein !== void 0) row.protein = patch.protein;
  if (patch.carbs !== void 0) row.carbs = patch.carbs;
  if (patch.fat !== void 0) row.fat = patch.fat;
  if (patch.quantity !== void 0) row.quantity = patch.quantity;
  if (patch.mealType !== void 0) row.meal_type = patch.mealType;
  if (patch.date !== void 0) row.date = patch.date;
  if (patch.barcode !== void 0) row.barcode = patch.barcode || null;
  if (patch.source !== void 0) row.source = patch.source;
  if (patch.photoUrl !== void 0) row.photo_url = patch.photoUrl || null;
  return row;
}
function isNewer(server, base) {
  if (!server) return false;
  if (!base) return true;
  return new Date(server).getTime() > new Date(base).getTime();
}
async function flushQueue() {
  if (typeof window === "undefined") return { synced: 0, failed: 0, conflicts: 0 };
  if (flushing$1) return { synced: 0, failed: 0, conflicts: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0, conflicts: 0 };
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0, conflicts: 0 };
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) return { synced: 0, failed: 0, conflicts: 0 };
  flushing$1 = true;
  let synced = 0;
  let failed = 0;
  let conflicts = 0;
  const remaining = [];
  const idMap = {};
  const localBaseline = {};
  try {
    for (const op of queue) {
      try {
        if (op.type === "create") {
          const { data, error } = await supabase.from("food_entries").insert(toInsertRow(op.payload, userId)).select("id, updated_at").single();
          if (error || !data) throw error || new Error("insert failed");
          idMap[op.localId] = data.id;
          localBaseline[data.id] = data.updated_at || null;
          synced++;
        } else if (op.type === "update") {
          const targetId = idMap[op.id] || op.id;
          const { data: current } = await supabase.from("food_entries").select("id, updated_at, name").eq("id", targetId).maybeSingle();
          const baseline = localBaseline[targetId] ?? op.baseUpdatedAt ?? null;
          if (!current) {
            if (op.snapshot) {
              const { snapshot } = op;
              const insertRow = toInsertRow(
                { ...snapshot, ...op.payload },
                userId
              );
              insertRow.id = targetId;
              const { data: ins, error: insErr } = await supabase.from("food_entries").insert(insertRow).select("id, updated_at").single();
              if (insErr || !ins) throw insErr || new Error("resurrect failed");
              localBaseline[ins.id] = ins.updated_at || null;
              pushConflict({
                kind: "update-on-deleted",
                id: targetId,
                opType: "update",
                resolution: "resurrected",
                baseUpdatedAt: baseline,
                serverUpdatedAt: null,
                resolvedAt: Date.now(),
                label: op.snapshot.name
              });
              conflicts++;
              synced++;
            } else {
              synced++;
            }
          } else {
            const serverUpdatedAt = current.updated_at;
            const conflict = isNewer(serverUpdatedAt, baseline);
            const { data: upd, error } = await supabase.from("food_entries").update(toUpdateRow(op.payload)).eq("id", targetId).select("id, updated_at").single();
            if (error) throw error;
            localBaseline[targetId] = upd?.updated_at || null;
            if (conflict) {
              pushConflict({
                kind: "update-vs-newer-server",
                id: targetId,
                opType: "update",
                resolution: "client-wins",
                baseUpdatedAt: baseline,
                serverUpdatedAt,
                resolvedAt: Date.now(),
                label: current.name
              });
              conflicts++;
            }
            synced++;
          }
        } else if (op.type === "delete") {
          const targetId = idMap[op.id] || op.id;
          const { data: current } = await supabase.from("food_entries").select("id, updated_at, name").eq("id", targetId).maybeSingle();
          if (!current) {
            synced++;
          } else {
            const serverUpdatedAt = current.updated_at;
            const baseline = localBaseline[targetId] ?? op.baseUpdatedAt ?? null;
            const conflict = isNewer(serverUpdatedAt, baseline);
            const { error } = await supabase.from("food_entries").delete().eq("id", targetId);
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
                label: current.name
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
    flushing$1 = false;
  }
  if (Object.keys(idMap).length > 0) {
    try {
      const cached = JSON.parse(localStorage.getItem("zyrafit_entries") || "[]");
      const updated = cached.map(
        (e) => idMap[e.id] ? { ...e, id: idMap[e.id] } : e
      );
      localStorage.setItem("zyrafit_entries", JSON.stringify(updated));
    } catch {
    }
  }
  return { synced, failed, conflicts };
}
async function requestBackgroundSync() {
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync?.register(SYNC_TAG);
    }
  } catch {
  }
}
let initialized$1 = false;
function initSyncQueue() {
  if (initialized$1 || typeof window === "undefined") return;
  initialized$1 = true;
  const tryFlush = () => {
    flushQueue().catch(() => {
    });
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
const STORAGE_KEY = "zyrafit_entries";
const GOAL_KEY = "zyrafit_goal";
function getLocalEntries() {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}
function setLocalEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
function getCalorieGoal() {
  if (typeof window === "undefined") return 2e3;
  const stored = localStorage.getItem(GOAL_KEY);
  return stored ? parseInt(stored, 10) : 2e3;
}
function setCalorieGoalLocal(goal) {
  localStorage.setItem(GOAL_KEY, String(goal));
}
async function getCurrentUserId() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}
async function getEntries(date) {
  const userId = await getCurrentUserId();
  if (userId) {
    const { data, error } = await supabase.from("food_entries").select("*").eq("date", date).order("created_at", { ascending: true });
    if (!error && data) {
      const entries = data.map((row) => ({
        id: row.id,
        name: row.name,
        calories: Number(row.calories),
        protein: Number(row.protein),
        carbs: Number(row.carbs),
        fat: Number(row.fat),
        quantity: row.quantity,
        mealType: row.meal_type,
        date: row.date,
        barcode: row.barcode,
        source: row.source || "manual",
        photoUrl: row.photo_url || null,
        updatedAt: row.updated_at || null
      }));
      const all = getLocalEntries().filter((e) => e.date !== date);
      setLocalEntries([...all, ...entries]);
      return entries;
    }
  }
  return getLocalEntries().filter((e) => e.date === date);
}
async function addEntry(entry) {
  const userId = await getCurrentUserId();
  const localId = crypto.randomUUID();
  if (userId && (typeof navigator === "undefined" || navigator.onLine)) {
    const insertData = {
      user_id: userId,
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      quantity: entry.quantity,
      meal_type: entry.mealType,
      date: entry.date,
      barcode: entry.barcode || null,
      source: entry.source || "manual"
    };
    if (entry.photoUrl) {
      insertData.photo_url = entry.photoUrl;
    }
    try {
      const { data, error } = await supabase.from("food_entries").insert(insertData).select().single();
      if (!error && data) {
        const newEntry2 = {
          id: data.id,
          name: data.name,
          calories: Number(data.calories),
          protein: Number(data.protein),
          carbs: Number(data.carbs),
          fat: Number(data.fat),
          quantity: data.quantity,
          mealType: data.meal_type,
          date: data.date,
          barcode: data.barcode,
          source: data.source || "manual",
          photoUrl: data.photo_url || null,
          updatedAt: data.updated_at || null
        };
        const all2 = getLocalEntries();
        all2.push(newEntry2);
        setLocalEntries(all2);
        return newEntry2;
      }
    } catch {
    }
  }
  const newEntry = { ...entry, id: localId };
  const all = getLocalEntries();
  all.push(newEntry);
  setLocalEntries(all);
  if (userId) enqueueEntry(entry, localId);
  return newEntry;
}
async function deleteEntry(id) {
  const userId = await getCurrentUserId();
  const online = typeof navigator === "undefined" || navigator.onLine;
  const all = getLocalEntries();
  const deleted = all.find((e) => e.id === id) || null;
  if (userId && online) {
    try {
      if (!deleted) {
        const { data } = await supabase.from("food_entries").select("*").eq("id", id).maybeSingle();
        if (data) {
          const entry = {
            id: data.id,
            name: data.name,
            calories: Number(data.calories),
            protein: Number(data.protein),
            carbs: Number(data.carbs),
            fat: Number(data.fat),
            quantity: data.quantity,
            mealType: data.meal_type,
            date: data.date,
            barcode: data.barcode,
            source: data.source || "manual",
            photoUrl: data.photo_url || null,
            updatedAt: data.updated_at || null
          };
          await supabase.from("food_entries").delete().eq("id", id);
          setLocalEntries(all.filter((e) => e.id !== id));
          return entry;
        }
      }
      await supabase.from("food_entries").delete().eq("id", id);
      setLocalEntries(all.filter((e) => e.id !== id));
      return deleted;
    } catch {
    }
  }
  setLocalEntries(all.filter((e) => e.id !== id));
  if (userId) enqueueDelete(id, { baseUpdatedAt: deleted?.updatedAt ?? null });
  return deleted;
}
async function updateEntry(id, patch) {
  const userId = await getCurrentUserId();
  const online = typeof navigator === "undefined" || navigator.onLine;
  const all = getLocalEntries();
  const existing = all.find((e) => e.id === id) || null;
  const baseUpdatedAt = existing?.updatedAt ?? null;
  const updated = all.map((e) => e.id === id ? { ...e, ...patch } : e);
  setLocalEntries(updated);
  if (userId && online) {
    try {
      const row = {};
      if (patch.name !== void 0) row.name = patch.name;
      if (patch.calories !== void 0) row.calories = patch.calories;
      if (patch.protein !== void 0) row.protein = patch.protein;
      if (patch.carbs !== void 0) row.carbs = patch.carbs;
      if (patch.fat !== void 0) row.fat = patch.fat;
      if (patch.quantity !== void 0) row.quantity = patch.quantity;
      if (patch.mealType !== void 0) row.meal_type = patch.mealType;
      if (patch.date !== void 0) row.date = patch.date;
      if (patch.barcode !== void 0) row.barcode = patch.barcode || null;
      if (patch.source !== void 0) row.source = patch.source;
      if (patch.photoUrl !== void 0) row.photo_url = patch.photoUrl || null;
      const { error } = await supabase.from("food_entries").update(row).eq("id", id);
      if (!error) return;
    } catch {
    }
  }
  if (userId) {
    enqueueUpdate(id, patch, {
      baseUpdatedAt,
      snapshot: existing ? { ...existing, ...patch } : void 0
    });
  }
}
async function restoreEntry(entry) {
  const userId = await getCurrentUserId();
  const online = typeof navigator === "undefined" || navigator.onLine;
  const all = getLocalEntries();
  all.push(entry);
  setLocalEntries(all);
  if (userId && online) {
    try {
      const { error } = await supabase.from("food_entries").insert({
        id: entry.id,
        user_id: userId,
        name: entry.name,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        quantity: entry.quantity,
        meal_type: entry.mealType,
        date: entry.date,
        barcode: entry.barcode || null,
        source: entry.source,
        photo_url: entry.photoUrl || null
      });
      if (!error) return;
    } catch {
    }
  }
  if (userId) {
    const { id, ...rest } = entry;
    enqueueEntry(rest, id);
  }
}
const MACRO_GOALS_KEY = "zyrafit_macro_goals";
function getMacroGoalsLocal() {
  if (typeof window === "undefined") return { protein: 0, carbs: 0, fat: 0 };
  try {
    const stored = localStorage.getItem(MACRO_GOALS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
  }
  return { protein: 0, carbs: 0, fat: 0 };
}
function setMacroGoalsLocal(goals) {
  localStorage.setItem(MACRO_GOALS_KEY, JSON.stringify(goals));
}
async function loadMacroGoals() {
  const userId = await getCurrentUserId();
  if (userId) {
    const { data } = await supabase.from("user_settings").select("protein_goal, carbs_goal, fat_goal").eq("user_id", userId).maybeSingle();
    if (data) {
      const goals = {
        protein: data.protein_goal || 0,
        carbs: data.carbs_goal || 0,
        fat: data.fat_goal || 0
      };
      setMacroGoalsLocal(goals);
      return goals;
    }
  }
  return getMacroGoalsLocal();
}
async function loadCalorieGoal() {
  const userId = await getCurrentUserId();
  if (userId) {
    const { data } = await supabase.from("user_settings").select("daily_calorie_goal").eq("user_id", userId).maybeSingle();
    if (data) {
      const goal = data.daily_calorie_goal;
      setCalorieGoalLocal(goal);
      return goal;
    }
  }
  return getCalorieGoal();
}
async function saveCalorieGoal(goal) {
  setCalorieGoalLocal(goal);
  const userId = await getCurrentUserId();
  if (userId) {
    const { data: existing } = await supabase.from("user_settings").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await supabase.from("user_settings").update({ daily_calorie_goal: goal }).eq("user_id", userId);
    } else {
      await supabase.from("user_settings").insert({ user_id: userId, daily_calorie_goal: goal });
    }
  }
}
async function searchFoodHistory(query) {
  const userId = await getCurrentUserId();
  const seen = /* @__PURE__ */ new Map();
  if (userId) {
    let dbQuery = supabase.from("food_entries").select("name, calories, protein, carbs, fat").order("created_at", { ascending: false }).limit(50);
    if (query.trim()) {
      dbQuery = dbQuery.ilike("name", `%${query.trim()}%`);
    }
    const { data } = await dbQuery;
    if (data) {
      for (const row of data) {
        const key = row.name.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, {
            name: row.name,
            calories: Number(row.calories),
            protein: Number(row.protein),
            carbs: Number(row.carbs),
            fat: Number(row.fat)
          });
        }
      }
    }
  }
  const local = getLocalEntries();
  const lowerQuery = query.toLowerCase();
  for (const entry of local.reverse()) {
    const key = entry.name.toLowerCase();
    if (!seen.has(key) && (!query.trim() || key.includes(lowerQuery))) {
      seen.set(key, {
        name: entry.name,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat
      });
    }
  }
  return Array.from(seen.values()).slice(0, 20);
}
async function getWeeklyHistory() {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dateMeta = [];
  for (let i = 6; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    dateMeta.push({
      date: d.toISOString().split("T")[0],
      label: dayNames[d.getDay()]
    });
  }
  const startDate = dateMeta[0].date;
  const endDate = dateMeta[dateMeta.length - 1].date;
  const userId = await getCurrentUserId();
  let entriesByDate = /* @__PURE__ */ new Map();
  if (userId) {
    const { data, error } = await supabase.from("food_entries").select("*").gte("date", startDate).lte("date", endDate);
    if (!error && data) {
      for (const row of data) {
        const e = {
          id: row.id,
          name: row.name,
          calories: Number(row.calories),
          protein: Number(row.protein),
          carbs: Number(row.carbs),
          fat: Number(row.fat),
          quantity: row.quantity,
          mealType: row.meal_type,
          date: row.date,
          barcode: row.barcode,
          source: row.source || "manual",
          photoUrl: row.photo_url || null,
          updatedAt: row.updated_at || null
        };
        const arr = entriesByDate.get(e.date) || [];
        arr.push(e);
        entriesByDate.set(e.date, arr);
      }
    }
  } else {
    for (const e of getLocalEntries()) {
      const arr = entriesByDate.get(e.date) || [];
      arr.push(e);
      entriesByDate.set(e.date, arr);
    }
  }
  return dateMeta.map(({ date, label }) => {
    const totals = getDailyTotals(entriesByDate.get(date) || []);
    return { date, label, ...totals };
  });
}
function getTodayDate() {
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
function getDailyTotals(entries) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories * e.quantity,
      protein: acc.protein + e.protein * e.quantity,
      carbs: acc.carbs + e.carbs * e.quantity,
      fat: acc.fat + e.fat * e.quantity
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
function getEntriesByMeal(entries) {
  return {
    breakfast: entries.filter((e) => e.mealType === "breakfast"),
    lunch: entries.filter((e) => e.mealType === "lunch"),
    dinner: entries.filter((e) => e.mealType === "dinner"),
    snack: entries.filter((e) => e.mealType === "snack")
  };
}
const MEAL_LABELS = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks"
};
const MEAL_ICONS = {
  breakfast: "☀️",
  lunch: "🌤️",
  dinner: "🌙",
  snack: "🍿"
};
async function getLoggingStreak() {
  const userId = await getCurrentUserId();
  if (!userId) {
    const local = getLocalEntries();
    return calcStreakFromDates(local.map((e) => e.date));
  }
  const { data, error } = await supabase.from("food_entries").select("date").eq("user_id", userId).order("date", { ascending: false }).limit(365);
  if (error || !data) return 0;
  const dates = data.map((r) => r.date);
  return calcStreakFromDates(dates);
}
function calcStreakFromDates(dates) {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates)].sort().reverse();
  const today = getTodayDate();
  const yesterday = /* @__PURE__ */ new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  if (unique[0] !== today && unique[0] !== yesterdayStr) return 0;
  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1e3 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
const DB_NAME = "zyrafit_ai_queue";
const STORE = "scans";
const DB_VERSION = 1;
const MAX_ATTEMPTS = 3;
function openDb() {
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
async function tx(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function getAll() {
  if (typeof indexedDB === "undefined") return [];
  try {
    const all = await tx("readonly", (s) => s.getAll());
    return (all || []).sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}
async function put(scan) {
  await tx("readwrite", (s) => s.put(scan));
  emit();
}
async function remove(id) {
  await tx("readwrite", (s) => s.delete(id));
  emit();
}
const listeners = /* @__PURE__ */ new Set();
async function emit() {
  const all = await getAll();
  for (const l of listeners) l(all.length);
}
function onAIQueueChange(fn) {
  listeners.add(fn);
  getAll().then((all) => fn(all.length));
  return () => {
    listeners.delete(fn);
  };
}
async function getAIQueueCount() {
  return (await getAll()).length;
}
async function enqueueFoodScan(args) {
  const id = crypto.randomUUID();
  await put({
    id,
    kind: "food",
    imageBase64: args.imageBase64,
    mealType: args.mealType,
    date: args.date,
    placeholderEntryId: args.placeholderEntryId,
    createdAt: Date.now(),
    attempts: 0
  });
  scheduleFlush();
  return id;
}
async function enqueueBodyScan(imageBase64) {
  const id = crypto.randomUUID();
  await put({
    id,
    kind: "body",
    imageBase64,
    createdAt: Date.now(),
    attempts: 0
  });
  scheduleFlush();
  return id;
}
let flushing = false;
let flushTimer;
function scheduleFlush(delay = 0) {
  if (typeof window === "undefined") return;
  if (flushTimer) window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(() => {
    flushTimer = void 0;
    flushAIQueue().catch(() => {
    });
  }, delay);
}
async function flushAIQueue() {
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
          if (item.kind === "food" && item.placeholderEntryId) {
            await deleteEntry(item.placeholderEntryId).catch(() => {
            });
          }
          await remove(item.id);
          failed++;
          toast.error(
            item.kind === "food" ? "Couldn't analyze photo after 3 tries" : "Couldn't read body scan after 3 tries",
            { description: message }
          );
        } else {
          const backoff = attempts === 1 ? 5e3 : 3e4;
          await put({
            ...item,
            attempts,
            lastError: message,
            nextRetryAt: Date.now() + backoff
          });
          deferred++;
          nextRetryDelay = Math.min(nextRetryDelay, backoff);
        }
      }
    }
  } finally {
    flushing = false;
  }
  if (deferred > 0 && Number.isFinite(nextRetryDelay)) {
    scheduleFlush(nextRetryDelay + 100);
  }
  if (synced > 0) {
    toast.success(
      synced === 1 ? "Photo analysis complete" : `${synced} pending scans synced`
    );
  }
  return { synced, failed, deferred };
}
async function processFoodScan(item) {
  const { data, error } = await supabase.functions.invoke("analyze-food", {
    body: { imageBase64: item.imageBase64 }
  });
  if (error) throw new Error(error.message || "Network error");
  if (data?.ok === false) throw new Error(data.error || "AI analysis failed");
  if (!data?.is_food || !Array.isArray(data?.items) || data.items.length === 0) {
    throw new Error("No food detected");
  }
  const first = data.items[0];
  if (item.placeholderEntryId) {
    await updateEntry(item.placeholderEntryId, {
      name: first.name || "Food",
      calories: Number(first.calories) || 0,
      protein: Number(first.protein) || 0,
      carbs: Number(first.carbs) || 0,
      fat: Number(first.fat) || 0
    });
  }
}
async function processBodyScan(item) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error("Not signed in");
  const { data, error } = await supabase.functions.invoke("scan-body-stats", {
    body: { imageBase64: item.imageBase64 }
  });
  if (error) throw new Error(error.message || "Network error");
  if (data?.ok === false) throw new Error(data.error || "AI analysis failed");
  if (!data?.found || !data?.weight_kg) throw new Error("No body stats found");
  const { error: insertError } = await supabase.from("weight_logs").insert({
    user_id: userId,
    weight_kg: data.weight_kg,
    logged_at: data.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    bmi: data.bmi || null,
    body_fat_percent: data.body_fat_percent || null,
    body_fat_mass_kg: data.body_fat_mass_kg || null,
    height_m: data.height_m || null
  });
  if (insertError) throw insertError;
}
let initialized = false;
function initAIScanQueue() {
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
const aiScanQueue = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  enqueueBodyScan,
  enqueueFoodScan,
  flushAIQueue,
  getAIQueueCount,
  initAIScanQueue,
  onAIQueueChange
}, Symbol.toStringTag, { value: "Module" }));
const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};
function webVibrate(pattern) {
  try {
    navigator?.vibrate?.(pattern);
  } catch {
  }
}
function hapticLight() {
  if (isNative()) {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
    });
    return;
  }
  webVibrate(10);
}
function hapticMedium() {
  if (isNative()) {
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
    });
    return;
  }
  webVibrate(20);
}
function hapticHeavy() {
  if (isNative()) {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {
    });
    return;
  }
  webVibrate([30, 10, 30]);
}
function hapticSuccess() {
  if (isNative()) {
    Haptics.notification({ type: NotificationType.Success }).catch(() => {
    });
    return;
  }
  webVibrate([10, 30, 10]);
}
function SyncStatusBanner() {
  const [mealCount, setMealCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [justSynced, setJustSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState(null);
  const total = mealCount + aiCount;
  useEffect(() => {
    const unsubMeals = onQueueChange((n) => {
      setMealCount((prev) => {
        if (prev + aiCount > 0 && n + aiCount === 0) {
          setJustSynced(true);
          setLastError(null);
          window.setTimeout(() => setJustSynced(false), 2200);
        }
        return n;
      });
    });
    const unsubAI = onAIQueueChange((n) => {
      setAiCount((prev) => {
        if (prev + mealCount > 0 && n + mealCount === 0) {
          setJustSynced(true);
          setLastError(null);
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
      unsubMeals();
      unsubAI();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  const seenConflictKeys = useRef(/* @__PURE__ */ new Set());
  useEffect(() => {
    const unsub = onConflictsChange((conflicts) => {
      if (seenConflictKeys.current.size === 0 && conflicts.length > 0) {
        for (const c of conflicts) seenConflictKeys.current.add(`${c.resolvedAt}:${c.id}`);
        return;
      }
      const fresh = [];
      for (const c of conflicts) {
        const key = `${c.resolvedAt}:${c.id}`;
        if (!seenConflictKeys.current.has(key)) {
          seenConflictKeys.current.add(key);
          fresh.push(c);
        }
      }
      for (const c of fresh) {
        const label = c.label ?? "entry";
        if (c.kind === "update-on-deleted") {
          toast("Restored an edit", {
            description: `"${label}" was removed on another device — your offline edit brought it back.`
          });
        } else if (c.kind === "update-vs-newer-server") {
          toast("Your edit overwrote a newer change", {
            description: `"${label}" was changed elsewhere while you were offline. Your version was kept.`
          });
        } else if (c.kind === "delete-vs-newer-server") {
          toast("Deleted despite newer changes", {
            description: `"${label}" was edited on another device after you deleted it offline. The deletion was applied.`
          });
        }
      }
    });
    return unsub;
  }, []);
  const handleRetry = async () => {
    if (syncing) return;
    if (!online) {
      hapticLight();
      return;
    }
    hapticMedium();
    setSyncing(true);
    setLastError(null);
    try {
      const [mealResult, aiResult] = await Promise.all([flushQueue(), flushAIQueue()]);
      const totalFailed = mealResult.failed + aiResult.failed;
      const totalSynced = mealResult.synced + aiResult.synced;
      if (totalFailed > 0 && totalSynced === 0) {
        setLastError(`Couldn't sync ${totalFailed} item${totalFailed > 1 ? "s" : ""}`);
        window.setTimeout(() => setLastError(null), 3500);
      }
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Sync failed");
      window.setTimeout(() => setLastError(null), 3500);
    } finally {
      setSyncing(false);
    }
  };
  const visible = total > 0 || justSynced;
  return /* @__PURE__ */ jsx(AnimatePresence, { children: visible && /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { y: -20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 },
      transition: { type: "spring", stiffness: 400, damping: 32 },
      className: "fixed top-2 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100%-24px)]",
      children: justSynced ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 py-2 rounded-full bg-success text-success-foreground shadow-lg text-sm font-medium", children: [
        /* @__PURE__ */ jsx(Check, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsx("span", { children: "Synced" })
      ] }) : /* @__PURE__ */ jsxs(
        motion.button,
        {
          onClick: handleRetry,
          disabled: syncing,
          whileTap: { scale: 0.96 },
          className: `flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full backdrop-blur-md shadow-lg text-sm font-medium transition-colors ${lastError ? "bg-destructive text-destructive-foreground" : "bg-foreground/90 text-background"}`,
          children: [
            !online ? /* @__PURE__ */ jsx(CloudOff, { className: "w-4 h-4" }) : lastError ? /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4" }) : aiCount > 0 ? /* @__PURE__ */ jsx(Sparkles, { className: `w-4 h-4 ${syncing ? "animate-pulse" : ""}` }) : /* @__PURE__ */ jsx(RefreshCw, { className: `w-4 h-4 ${syncing ? "animate-spin" : ""}` }),
            /* @__PURE__ */ jsx("span", { className: "text-[13px]", children: !online ? `${total} pending — offline` : lastError ? lastError : syncing ? "Syncing…" : aiCount > 0 && mealCount > 0 ? `${aiCount} scan${aiCount > 1 ? "s" : ""} · ${mealCount} meal${mealCount > 1 ? "s" : ""}` : aiCount > 0 ? `${aiCount} scan${aiCount > 1 ? "s" : ""} pending` : `${mealCount} pending` }),
            online && !syncing && /* @__PURE__ */ jsx(
              "span",
              {
                className: `ml-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${lastError ? "bg-destructive-foreground/20 text-destructive-foreground" : "bg-background/15 text-background"}`,
                children: lastError ? "Try again" : "Retry"
              }
            )
          ]
        }
      )
    }
  ) });
}
const EDGE_WIDTH = 24;
const TRIGGER_DISTANCE = 80;
function SwipeBackGesture() {
  const router2 = useRouter();
  const location2 = useLocation();
  const [dragX, setDragX] = useState(0);
  const [active, setActive] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const horizontal = useRef(false);
  const disabled = location2.pathname === "/" || location2.pathname === "/welcome" || location2.pathname === "/login" || location2.pathname === "/onboarding";
  useEffect(() => {
    if (disabled) return;
    const onPointerDown = (e) => {
      if (e.pointerType === "mouse") return;
      if (e.clientX > EDGE_WIDTH) return;
      tracking.current = true;
      horizontal.current = false;
      startX.current = e.clientX;
      startY.current = e.clientY;
    };
    const onPointerMove = (e) => {
      if (!tracking.current) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      if (!horizontal.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          tracking.current = false;
          return;
        }
        horizontal.current = true;
        setActive(true);
      }
      if (dx > 0) {
        setDragX(Math.min(dx, window.innerWidth));
        e.preventDefault();
      }
    };
    const onPointerUp = () => {
      if (!tracking.current) return;
      const triggered = dragXRef.current >= TRIGGER_DISTANCE;
      tracking.current = false;
      horizontal.current = false;
      setActive(false);
      setDragX(0);
      if (triggered) {
        try {
          navigator?.vibrate?.(12);
        } catch {
        }
        router2.history.back();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointermove", onPointerMove, { passive: false });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointercancel", onPointerUp, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
    };
  }, [disabled, router2]);
  const dragXRef = useRef(0);
  useEffect(() => {
    dragXRef.current = dragX;
  }, [dragX]);
  if (disabled) return null;
  const progress = Math.min(dragX / TRIGGER_DISTANCE, 1);
  return /* @__PURE__ */ jsx(AnimatePresence, { children: active && /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: progress },
      exit: { opacity: 0 },
      className: "fixed top-1/2 -translate-y-1/2 z-[100] pointer-events-none",
      style: {
        left: Math.max(8, dragX - 40)
      },
      children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-full bg-foreground/80 backdrop-blur-md shadow-lg", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-6 h-6 text-background" }) })
    }
  ) });
}
function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const host = window.location.hostname;
  const isPreviewHost = host.includes("id-preview--") || host.includes("lovableproject.com") || host.includes("lovable.app") || host === "localhost" || host === "127.0.0.1";
  if (isInIframe || isPreviewHost) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((r) => r.unregister());
    }).catch(() => {
    });
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      setInterval(() => registration.update().catch(() => {
      }), 60 * 60 * 1e3);
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            newWorker.postMessage("SKIP_WAITING");
          }
        });
      });
    }).catch(() => {
    });
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
const appCss = "/assets/styles-D1Cclm8f.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/app",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
const Route$a = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" },
      { title: "ZyraFit — Daily Calorie & Macro Tracker" },
      { name: "description", content: "Track your daily calories and macros with AI-powered food recognition." },
      { name: "author", content: "ZyraFit" },
      // PWA / native shell — keep both apple- and modern mobile-web-app-capable to satisfy iOS and Lighthouse.
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "ZyraFit" },
      { name: "format-detection", content: "telephone=no" },
      // Match manifest background so iOS/Android status bar doesn't flash white on launch.
      { name: "theme-color", content: "#1a1b2f" },
      { name: "color-scheme", content: "light dark" },
      { property: "og:title", content: "ZyraFit — Daily Calorie & Macro Tracker" },
      { property: "og:description", content: "Track your daily calories and macros with AI-powered food recognition." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "ZyraFit — Daily Calorie & Macro Tracker" },
      { name: "twitter:description", content: "Track your daily calories and macros with AI-powered food recognition." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4d7ae14c-a791-4ccf-bf3d-149f555bf01d/id-preview-1bfeeffa--26243190-be17-49c7-ac1c-6de0c51231ee.lovable.app-1776644464271.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4d7ae14c-a791-4ccf-bf3d-149f555bf01d/id-preview-1bfeeffa--26243190-be17-49c7-ac1c-6de0c51231ee.lovable.app-1776644464271.png" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      // Speed up the very first auth + data round-trip by warming the TLS
      // connection to Lovable Cloud during HTML parse.
      { rel: "preconnect", href: "https://kmoxjqrkcdrwvqnlyalf.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://kmoxjqrkcdrwvqnlyalf.supabase.co" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      // iOS PWA splash screens
      { rel: "apple-touch-startup-image", href: "/splash/apple-splash-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { rel: "apple-touch-startup-image", href: "/splash/apple-splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { rel: "apple-touch-startup-image", href: "/splash/apple-splash-1284x2778.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { rel: "apple-touch-startup-image", href: "/splash/apple-splash-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { rel: "apple-touch-startup-image", href: "/splash/apple-splash-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { rel: "apple-touch-startup-image", href: "/splash/apple-splash-1242x2688.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { rel: "apple-touch-startup-image", href: "/splash/apple-splash-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { rel: "apple-touch-startup-image", href: "/splash/apple-splash-1242x2208.png", media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { rel: "apple-touch-startup-image", href: "/splash/apple-splash-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", suppressHydrationWarning: true, children: [
    /* @__PURE__ */ jsx("head", { suppressHydrationWarning: true, children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { suppressHydrationWarning: true, children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const location2 = useLocation();
  useEffect(() => {
    registerServiceWorker();
    initSyncQueue();
    initAIScanQueue();
    const handleTap = (e) => {
      const target = e.target;
      if (!target) return;
      const tappable = target.closest(
        'button, a, [role="button"], input[type="checkbox"], input[type="radio"], label[for]'
      );
      if (!tappable) return;
      try {
        navigator?.vibrate?.(8);
      } catch {
      }
    };
    document.addEventListener("pointerdown", handleTap, { passive: true });
    return () => document.removeEventListener("pointerdown", handleTap);
  }, []);
  const isMarketingRoute = location2.pathname === "/terms" || location2.pathname === "/privacy-policy";
  if (isMarketingRoute) {
    return /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
        children: /* @__PURE__ */ jsx(Outlet, {})
      },
      location2.pathname
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-[430px] min-h-screen bg-background shadow-xl relative overflow-hidden", children: [
    /* @__PURE__ */ jsx(SwipeBackGesture, {}),
    /* @__PURE__ */ jsx(SyncStatusBanner, {}),
    false,
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
        children: /* @__PURE__ */ jsx(Outlet, {})
      },
      location2.pathname
    )
  ] });
}
const $$splitComponentImporter$8 = () => import("./welcome-AoNadlUG.js");
const Route$9 = createFileRoute("/welcome")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component"),
  head: () => ({
    meta: [{
      title: "ZyraFit — Welcome"
    }, {
      name: "description",
      content: "Track your calories and macros effortlessly. Get started or sign in."
    }]
  })
});
const $$splitComponentImporter$7 = () => import("./terms-BI7UqGiz.js");
const Route$8 = createFileRoute("/terms")({
  head: () => ({
    meta: [{
      title: "Terms of Service — ZyraFit"
    }, {
      name: "description",
      content: "The terms and conditions for using ZyraFit."
    }, {
      property: "og:title",
      content: "Terms of Service — ZyraFit"
    }, {
      property: "og:description",
      content: "The terms and conditions for using ZyraFit."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./reset-password-DIBsjr1v.js");
const Route$7 = createFileRoute("/reset-password")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component"),
  head: () => ({
    meta: [{
      title: "ZyraFit — Reset Password"
    }, {
      name: "description",
      content: "Set a new password for your ZyraFit account."
    }]
  })
});
const $$splitComponentImporter$5 = () => import("./profile-XgiDip5q.js");
const Route$6 = createFileRoute("/profile")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component"),
  head: () => ({
    meta: [{
      title: "ZyraFit — Profile"
    }, {
      name: "description",
      content: "View and edit your profile and macro goals."
    }]
  })
});
const $$splitComponentImporter$4 = () => import("./privacy-policy-BWNxQabF.js");
const Route$5 = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [{
      title: "Privacy Policy — ZyraFit"
    }, {
      name: "description",
      content: "ZyraFit's privacy policy outlining data collection, usage, and user rights."
    }, {
      property: "og:title",
      content: "Privacy Policy — ZyraFit"
    }, {
      property: "og:description",
      content: "Learn how ZyraFit protects your data and privacy."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./onboarding-BZMoBYRn.js").then((n) => n.o);
const Route$4 = createFileRoute("/onboarding")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component"),
  head: () => ({
    meta: [{
      title: "ZyraFit — Set Up Your Profile"
    }, {
      name: "description",
      content: "Tell us about yourself so we can personalize your experience."
    }]
  })
});
const $$splitComponentImporter$2 = () => import("./login-DvvSkEuY.js");
const Route$3 = createFileRoute("/login")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component"),
  head: () => ({
    meta: [{
      title: "ZyraFit — Sign In"
    }, {
      name: "description",
      content: "Sign in to ZyraFit with your phone number to sync your food diary across devices."
    }]
  })
});
const $$splitComponentImporter$1 = () => import("./app-BdX9R74j.js");
const Route$2 = createFileRoute("/app")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component"),
  head: () => ({
    meta: [{
      title: "ZyraFit — Daily Calorie & Macro Tracker"
    }, {
      name: "description",
      content: "Track your daily calories and macros with a beautiful, intuitive interface."
    }]
  })
});
const $$splitComponentImporter = () => import("./index-CkIwiqXb.js");
const Route$1 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
function userClient(token) {
  return createClient(
    process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}
const listFoodEntriesTool = defineTool({
  name: "list_food_entries",
  description: "List the user's logged food entries for a given date (YYYY-MM-DD). Defaults to today.",
  parameters: z.object({
    date: z.string().optional().describe("Date in YYYY-MM-DD format. Defaults to today (UTC).")
  }),
  execute: async ({ date }, { auth }) => {
    if (!auth?.token) return "Not authenticated.";
    const day = date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const supabase2 = userClient(auth.token);
    const { data, error } = await supabase2.from("food_entries").select("id,name,calories,protein,carbs,fat,meal,created_at").gte("created_at", `${day}T00:00:00Z`).lt("created_at", `${day}T23:59:59Z`).order("created_at", { ascending: true });
    if (error) return `Error: ${error.message}`;
    if (!data?.length) return `No food entries for ${day}.`;
    const totals = data.reduce(
      (a, e) => ({
        calories: a.calories + (e.calories ?? 0),
        protein: a.protein + (e.protein ?? 0),
        carbs: a.carbs + (e.carbs ?? 0),
        fat: a.fat + (e.fat ?? 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return JSON.stringify({ date: day, entries: data, totals }, null, 2);
  }
});
const getDailySummaryTool = defineTool({
  name: "get_daily_summary",
  description: "Get total calories and macros for the user on a given date.",
  parameters: z.object({
    date: z.string().optional()
  }),
  execute: async ({ date }, { auth }) => {
    if (!auth?.token) return "Not authenticated.";
    const day = date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const supabase2 = userClient(auth.token);
    const { data, error } = await supabase2.from("food_entries").select("calories,protein,carbs,fat").gte("created_at", `${day}T00:00:00Z`).lt("created_at", `${day}T23:59:59Z`);
    if (error) return `Error: ${error.message}`;
    const totals = (data ?? []).reduce(
      (a, e) => ({
        calories: a.calories + (e.calories ?? 0),
        protein: a.protein + (e.protein ?? 0),
        carbs: a.carbs + (e.carbs ?? 0),
        fat: a.fat + (e.fat ?? 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return JSON.stringify({ date: day, ...totals }, null, 2);
  }
});
const getBodyStatsTool = defineTool({
  name: "get_body_stats",
  description: "Get the user's most recent body composition stats (weight, BMI, body fat %).",
  parameters: z.object({}),
  execute: async (_args, { auth }) => {
    if (!auth?.token) return "Not authenticated.";
    const supabase2 = userClient(auth.token);
    const { data, error } = await supabase2.from("body_stats").select("*").order("recorded_at", { ascending: false }).limit(5);
    if (error) return `Error: ${error.message}`;
    return JSON.stringify(data, null, 2);
  }
});
const mcp = createMcpServer({
  name: "zyrafit-mcp",
  version: "1.0.0",
  instructions: "Tools to read the signed-in ZyraFit user's nutrition log and body composition. Authenticate by passing the user's Supabase access token as a Bearer token.",
  tools: [listFoodEntriesTool, getDailySummaryTool, getBodyStatsTool]
});
const handler = withMcpAuth(
  async (request, auth) => mcp.handleRequest(request, { auth }),
  async (request) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    return { token };
  }
);
const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      GET: async ({ request }) => handler(request),
      POST: async ({ request }) => handler(request),
      DELETE: async ({ request }) => handler(request)
    }
  }
});
const WelcomeRoute = Route$9.update({
  id: "/welcome",
  path: "/welcome",
  getParentRoute: () => Route$a
});
const TermsRoute = Route$8.update({
  id: "/terms",
  path: "/terms",
  getParentRoute: () => Route$a
});
const ResetPasswordRoute = Route$7.update({
  id: "/reset-password",
  path: "/reset-password",
  getParentRoute: () => Route$a
});
const ProfileRoute = Route$6.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => Route$a
});
const PrivacyPolicyRoute = Route$5.update({
  id: "/privacy-policy",
  path: "/privacy-policy",
  getParentRoute: () => Route$a
});
const OnboardingRoute = Route$4.update({
  id: "/onboarding",
  path: "/onboarding",
  getParentRoute: () => Route$a
});
const LoginRoute = Route$3.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$a
});
const AppRoute = Route$2.update({
  id: "/app",
  path: "/app",
  getParentRoute: () => Route$a
});
const IndexRoute = Route$1.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$a
});
const ApiMcpRoute = Route.update({
  id: "/api/mcp",
  path: "/api/mcp",
  getParentRoute: () => Route$a
});
const rootRouteChildren = {
  IndexRoute,
  AppRoute,
  LoginRoute,
  OnboardingRoute,
  PrivacyPolicyRoute,
  ProfileRoute,
  ResetPasswordRoute,
  TermsRoute,
  WelcomeRoute,
  ApiMcpRoute
};
const routeTree = Route$a._addFileChildren(rootRouteChildren)._addFileTypes();
function DefaultErrorComponent({
  error,
  reset
}) {
  const router2 = useRouter();
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        className: "h-8 w-8 text-destructive",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: 2,
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Something went wrong" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "An unexpected error occurred. Please try again." }),
    false,
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  MEAL_LABELS as M,
  hapticSuccess as a,
  saveCalorieGoal as b,
  hapticMedium as c,
  hapticHeavy as d,
  MEAL_ICONS as e,
  getMacroGoalsLocal as f,
  getTodayDate as g,
  hapticLight as h,
  getEntries as i,
  getWeeklyHistory as j,
  getLoggingStreak as k,
  loadCalorieGoal as l,
  loadMacroGoals as m,
  getDailyTotals as n,
  getEntriesByMeal as o,
  deleteEntry as p,
  addEntry as q,
  restoreEntry as r,
  supabase as s,
  searchFoodHistory as t,
  updateEntry as u,
  aiScanQueue as v,
  router as w
};
