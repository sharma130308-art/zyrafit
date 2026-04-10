export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

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
}

const STORAGE_KEY = "caltrack_entries";
const GOAL_KEY = "caltrack_goal";

export function getCalorieGoal(): number {
  if (typeof window === "undefined") return 2000;
  const stored = localStorage.getItem(GOAL_KEY);
  return stored ? parseInt(stored, 10) : 2000;
}

export function setCalorieGoal(goal: number) {
  localStorage.setItem(GOAL_KEY, String(goal));
}

export function getEntries(date: string): FoodEntry[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  const all: FoodEntry[] = JSON.parse(stored);
  return all.filter((e) => e.date === date);
}

export function addEntry(entry: Omit<FoodEntry, "id">): FoodEntry {
  const stored = localStorage.getItem(STORAGE_KEY);
  const all: FoodEntry[] = stored ? JSON.parse(stored) : [];
  const newEntry: FoodEntry = { ...entry, id: crypto.randomUUID() };
  all.push(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newEntry;
}

export function deleteEntry(id: string) {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  const all: FoodEntry[] = JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter((e) => e.id !== id)));
}

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
