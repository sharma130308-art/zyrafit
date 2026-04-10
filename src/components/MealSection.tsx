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
    <motion.div
      className="rounded-2xl bg-card p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] border border-border/40"
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.1 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{MEAL_ICONS[mealType]}</span>
          <h3 className="font-semibold text-[15px] text-card-foreground">{MEAL_LABELS[mealType]}</h3>
        </div>
        {totalCalories > 0 && (
          <motion.span
            className="text-sm font-semibold text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Math.round(totalCalories)} cal
          </motion.span>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {entries.length === 0 ? (
          <p className="text-[13px] text-muted-foreground/60 py-1">Tap + to add food</p>
        ) : (
          <div className="space-y-0.5">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-between py-2.5 border-t border-border/20 first:border-t-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-card-foreground truncate">{entry.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {Math.round(entry.calories * entry.quantity)} cal
                    <span className="mx-1">·</span>
                    P {Math.round(entry.protein * entry.quantity)}
                    <span className="mx-1">·</span>
                    C {Math.round(entry.carbs * entry.quantity)}
                    <span className="mx-1">·</span>
                    F {Math.round(entry.fat * entry.quantity)}
                    {entry.quantity > 1 && <span className="ml-1">×{entry.quantity}</span>}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => onDelete(entry.id)}
                  className="p-2 rounded-xl text-muted-foreground/50 hover:text-destructive hover:bg-destructive/8 transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
