import { supabase } from "@/integrations/supabase/client";
import { enqueueEntry } from "./sync-queue";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type FoodSource = "manual" | "barcode" | "ai";

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  mealType: MealType;
  date: string; // YYYY-MM-DD
  barcode?: string | null;
  source: FoodSource;
  photoUrl?: string | null;
}

const STORAGE_KEY = "zyrafit_entries";
const GOAL_KEY = "zyrafit_goal";

// ── Local helpers ──────────────────────────────────────────────

function getLocalEntries(): FoodEntry[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function setLocalEntries(entries: FoodEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getCalorieGoal(): number {
  if (typeof window === "undefined") return 2000;
  const stored = localStorage.getItem(GOAL_KEY);
  return stored ? parseInt(stored, 10) : 2000;
}

export function setCalorieGoalLocal(goal: number) {
  localStorage.setItem(GOAL_KEY, String(goal));
}

// ── Auth helper ────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ── CRUD (offline-first, syncs when logged in) ────────────────

export async function getEntries(date: string): Promise<FoodEntry[]> {
  const userId = await getCurrentUserId();

  if (userId) {
    const { data, error } = await supabase
      .from("food_entries")
      .select("*")
      .eq("date", date)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const entries: FoodEntry[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        calories: Number(row.calories),
        protein: Number(row.protein),
        carbs: Number(row.carbs),
        fat: Number(row.fat),
        quantity: row.quantity,
        mealType: row.meal_type as MealType,
        date: row.date,
        barcode: row.barcode,
        source: (row.source as FoodSource) || "manual",
        photoUrl: (row as any).photo_url || null,
      }));
      // Cache locally
      const all = getLocalEntries().filter((e) => e.date !== date);
      setLocalEntries([...all, ...entries]);
      return entries;
    }
  }

  // Fallback to local
  return getLocalEntries().filter((e) => e.date === date);
}

export async function addEntry(
  entry: Omit<FoodEntry, "id">
): Promise<FoodEntry> {
  const userId = await getCurrentUserId();
  const localId = crypto.randomUUID();

  if (userId && (typeof navigator === "undefined" || navigator.onLine)) {
    const insertData: any = {
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
      source: entry.source || "manual",
    };
    if (entry.photoUrl) {
      insertData.photo_url = entry.photoUrl;
    }

    try {
      const { data, error } = await supabase
        .from("food_entries")
        .insert(insertData)
        .select()
        .single();

      if (!error && data) {
        const newEntry: FoodEntry = {
          id: data.id,
          name: data.name,
          calories: Number(data.calories),
          protein: Number(data.protein),
          carbs: Number(data.carbs),
          fat: Number(data.fat),
          quantity: data.quantity,
          mealType: data.meal_type as MealType,
          date: data.date,
          barcode: data.barcode,
          source: (data.source as FoodSource) || "manual",
          photoUrl: (data as any).photo_url || null,
        };
        const all = getLocalEntries();
        all.push(newEntry);
        setLocalEntries(all);
        return newEntry;
      }
    } catch {
      // fall through to offline queue
    }
  }

  // Offline (or insert failed): save locally + queue for sync if logged in
  const newEntry: FoodEntry = { ...entry, id: localId };
  const all = getLocalEntries();
  all.push(newEntry);
  setLocalEntries(all);
  if (userId) enqueueEntry(entry, localId);
  return newEntry;
}

export async function deleteEntry(id: string): Promise<FoodEntry | null> {
  const userId = await getCurrentUserId();

  // Find the entry before deleting (for undo)
  const all = getLocalEntries();
  const deleted = all.find((e) => e.id === id) || null;

  if (userId) {
    // Fetch from DB if not in local cache
    if (!deleted) {
      const { data } = await supabase
        .from("food_entries")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const entry: FoodEntry = {
          id: data.id,
          name: data.name,
          calories: Number(data.calories),
          protein: Number(data.protein),
          carbs: Number(data.carbs),
          fat: Number(data.fat),
          quantity: data.quantity,
          mealType: data.meal_type as MealType,
          date: data.date,
          barcode: data.barcode,
          source: (data.source as FoodSource) || "manual",
          photoUrl: (data as any).photo_url || null,
        };
        await supabase.from("food_entries").delete().eq("id", id);
        setLocalEntries(all.filter((e) => e.id !== id));
        return entry;
      }
    }
    await supabase.from("food_entries").delete().eq("id", id);
  }

  setLocalEntries(all.filter((e) => e.id !== id));
  return deleted;
}

export async function restoreEntry(entry: FoodEntry): Promise<void> {
  const userId = await getCurrentUserId();

  if (userId) {
    await supabase.from("food_entries").insert({
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
      photo_url: entry.photoUrl || null,
    });
  }

  const all = getLocalEntries();
  all.push(entry);
  setLocalEntries(all);
}

// ── Settings (goal) ───────────────────────────────────────────

export async function loadCalorieGoal(): Promise<number> {
  const userId = await getCurrentUserId();

  if (userId) {
    const { data } = await supabase
      .from("user_settings")
      .select("daily_calorie_goal")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      const goal = data.daily_calorie_goal;
      setCalorieGoalLocal(goal);
      return goal;
    }
  }

  return getCalorieGoal();
}

export async function saveCalorieGoal(goal: number) {
  setCalorieGoalLocal(goal);
  const userId = await getCurrentUserId();

  if (userId) {
    const { data: existing } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_settings")
        .update({ daily_calorie_goal: goal })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("user_settings")
        .insert({ user_id: userId, daily_calorie_goal: goal });
    }
  }
}

// ── Food history / search ─────────────────────────────────────

export interface FoodTemplate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function searchFoodHistory(query: string): Promise<FoodTemplate[]> {
  const userId = await getCurrentUserId();
  const seen = new Map<string, FoodTemplate>();

  if (userId) {
    // Search DB — get unique foods by name, most recent first
    let dbQuery = supabase
      .from("food_entries")
      .select("name, calories, protein, carbs, fat")
      .order("created_at", { ascending: false })
      .limit(50);

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
            fat: Number(row.fat),
          });
        }
      }
    }
  }

  // Also search local entries
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
        fat: entry.fat,
      });
    }
  }

  return Array.from(seen.values()).slice(0, 20);
}

// ── Weekly history ─────────────────────────────────────────────

export interface DaySummary {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Mon"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function getWeeklyHistory(): Promise<DaySummary[]> {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dateMeta: { date: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateMeta.push({
      date: d.toISOString().split("T")[0],
      label: dayNames[d.getDay()],
    });
  }
  const startDate = dateMeta[0].date;
  const endDate = dateMeta[dateMeta.length - 1].date;

  const userId = await getCurrentUserId();
  let entriesByDate = new Map<string, FoodEntry[]>();

  if (userId) {
    const { data, error } = await supabase
      .from("food_entries")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate);
    if (!error && data) {
      for (const row of data) {
        const e: FoodEntry = {
          id: row.id,
          name: row.name,
          calories: Number(row.calories),
          protein: Number(row.protein),
          carbs: Number(row.carbs),
          fat: Number(row.fat),
          quantity: row.quantity,
          mealType: row.meal_type as MealType,
          date: row.date,
          barcode: row.barcode,
          source: (row.source as FoodSource) || "manual",
          photoUrl: (row as any).photo_url || null,
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

// ── Computed helpers ──────────────────────────────────────────

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function getDailyTotals(entries: FoodEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories * e.quantity,
      protein: acc.protein + e.protein * e.quantity,
      carbs: acc.carbs + e.carbs * e.quantity,
      fat: acc.fat + e.fat * e.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function getEntriesByMeal(entries: FoodEntry[]) {
  return {
    breakfast: entries.filter((e) => e.mealType === "breakfast"),
    lunch: entries.filter((e) => e.mealType === "lunch"),
    dinner: entries.filter((e) => e.mealType === "dinner"),
    snack: entries.filter((e) => e.mealType === "snack"),
  };
}

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

export const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "☀️",
  lunch: "🌤️",
  dinner: "🌙",
  snack: "🍿",
};

// ── Streak calculation ────────────────────────────────────────

export async function getLoggingStreak(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) {
    // Fallback: check local entries
    const local = getLocalEntries();
    return calcStreakFromDates(local.map((e) => e.date));
  }

  const { data, error } = await supabase
    .from("food_entries")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(365);

  if (error || !data) return 0;

  const dates = data.map((r) => r.date);
  return calcStreakFromDates(dates);
}

function calcStreakFromDates(dates: string[]): number {
  if (dates.length === 0) return 0;

  const unique = [...new Set(dates)].sort().reverse();
  const today = getTodayDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Streak must include today or yesterday
  if (unique[0] !== today && unique[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
