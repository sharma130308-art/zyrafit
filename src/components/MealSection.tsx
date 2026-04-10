import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { FoodEntry, MealType } from "@/lib/food-store";
import { MEAL_LABELS, MEAL_ICONS } from "@/lib/food-store";

interface MealSectionProps {
  mealType: MealType;
  entries: FoodEntry[];
  onDelete: (id: string) => void;
}

export function MealSection({ mealType, entries, onDelete }: MealSectionProps) {
  const totalCalories = entries.reduce((sum, e) => sum + e.calories * e.quantity, 0);

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{MEAL_ICONS[mealType]}</span>
          <h3 className="font-semibold text-card-foreground">{MEAL_LABELS[mealType]}</h3>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{totalCalories} cal</span>
      </div>

      <AnimatePresence>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No foods added yet</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between py-2 border-t border-border/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.calories * entry.quantity} cal · P: {entry.protein * entry.quantity}g · C: {entry.carbs * entry.quantity}g · F: {entry.fat * entry.quantity}g
                    {entry.quantity > 1 && ` · ×${entry.quantity}`}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
