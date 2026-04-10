import { supabase } from "@/integrations/supabase/client";

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
}

const STORAGE_KEY = "caltrack_entries";
const GOAL_KEY = "caltrack_goal";

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

  if (userId) {
    const { data, error } = await supabase
      .from("food_entries")
      .insert({
        user_id: userId,
        name: entry.name,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        quantity: entry.quantity,
        meal_type: entry.mealType,
        date: entry.date,
      })
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
      };
      // Update local cache
      const all = getLocalEntries();
      all.push(newEntry);
      setLocalEntries(all);
      return newEntry;
    }
  }

  // Offline fallback
  const newEntry: FoodEntry = { ...entry, id: localId };
  const all = getLocalEntries();
  all.push(newEntry);
  setLocalEntries(all);
  return newEntry;
}

export async function deleteEntry(id: string) {
  const userId = await getCurrentUserId();

  if (userId) {
    await supabase.from("food_entries").delete().eq("id", id);
  }

  const all = getLocalEntries().filter((e) => e.id !== id);
  setLocalEntries(all);
}

// ── Settings (goal) ───────────────────────────────────────────

export async function loadCalorieGoal(): Promise<number> {
  const userId = await getCurrentUserId();

  if (userId) {
    const { data } = await supabase
      .from("user_settings")
      .select("daily_calorie_goal")
      .single();

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
      .single();

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
