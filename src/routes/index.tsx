import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getEntries,
  addEntry,
  deleteEntry,
  getTodayDate,
  getDailyTotals,
  getEntriesByMeal,
  getCalorieGoal,
  type FoodEntry,
  type MealType,
} from "@/lib/food-store";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroBar } from "@/components/MacroBar";
import { MealSection } from "@/components/MealSection";
import { AddFoodDialog } from "@/components/AddFoodDialog";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "CalTrack — Daily Calorie & Macro Tracker" },
      { name: "description", content: "Track your daily calories and macros with a beautiful, intuitive interface." },
    ],
  }),
});

function Dashboard() {
  const today = getTodayDate();
  const [entries, setEntries] = useState<FoodEntry[]>(() => getEntries(today));
  const [dialogOpen, setDialogOpen] = useState(false);
  const goal = getCalorieGoal();

  const refresh = useCallback(() => {
    setEntries(getEntries(today));
  }, [today]);

  const handleAdd = (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    mealType: MealType;
  }) => {
    addEntry({ ...food, date: today });
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    refresh();
  };

  const totals = getDailyTotals(entries);
  const byMeal = getEntriesByMeal(entries);

  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-6 pt-14 pb-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground">Today</p>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </motion.div>
      </div>

      {/* Calorie Ring */}
      <motion.div
        className="flex justify-center py-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <CalorieRing consumed={totals.calories} goal={goal} />
      </motion.div>

      {/* Macros */}
      <motion.div
        className="px-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/50 flex gap-4">
          <MacroBar label="Protein" current={totals.protein} color="var(--color-protein)" />
          <MacroBar label="Carbs" current={totals.carbs} color="var(--color-carbs)" />
          <MacroBar label="Fat" current={totals.fat} color="var(--color-fat)" />
        </div>
      </motion.div>

      {/* Meal Sections */}
      <div className="px-6 space-y-3">
        {mealTypes.map((type, i) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <MealSection
              mealType={type}
              entries={byMeal[type]}
              onDelete={handleDelete}
            />
          </motion.div>
        ))}
      </div>

      <BottomNav onAddClick={() => setDialogOpen(true)} />
      <AddFoodDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}
