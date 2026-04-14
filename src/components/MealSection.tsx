import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, X } from "lucide-react";
import type { FoodEntry, MealType } from "@/lib/food-store";
import { MEAL_LABELS, MEAL_ICONS } from "@/lib/food-store";

interface MealSectionProps {
  mealType: MealType;
  entries: FoodEntry[];
  onDelete: (id: string) => void;
  onAdd?: (mealType: MealType) => void;
}

export function MealSection({ mealType, entries, onDelete, onAdd }: MealSectionProps) {
  const totalCalories = entries.reduce((sum, e) => sum + e.calories * e.quantity, 0);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<{ url: string; name: string } | null>(null);

  return (
    <>
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
          <div className="flex items-center gap-2">
            {totalCalories > 0 && (
              <motion.span
                className="text-sm font-semibold text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {Math.round(totalCalories)} cal
              </motion.span>
            )}
            {onAdd && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => onAdd(mealType)}
                className="p-1.5 rounded-xl bg-primary/10 text-primary"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {entries.length === 0 ? (
            <button
              onClick={() => onAdd?.(mealType)}
              className="text-[13px] text-muted-foreground/60 py-1 hover:text-primary transition-colors"
            >
              Tap + to add food
            </button>
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
                  {entry.photoUrl && (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setFullscreenPhoto({ url: entry.photoUrl!, name: entry.name })}
                      className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 mr-3 border border-border/30"
                    >
                      <img src={entry.photoUrl} alt={entry.name} className="w-full h-full object-cover" />
                    </motion.button>
                  )}
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

      {/* Fullscreen photo viewer */}
      <AnimatePresence>
        {fullscreenPhoto && (
          <motion.div
            className="fixed inset-0 z-[60] bg-foreground/95 backdrop-blur-xl flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenPhoto(null)}
          >
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 pt-14 pb-4">
              <p className="text-background font-semibold text-base truncate flex-1 mr-4">{fullscreenPhoto.name}</p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setFullscreenPhoto(null)}
                className="w-10 h-10 rounded-full bg-background/15 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-5 h-5 text-background" />
              </motion.button>
            </div>
            <motion.img
              src={fullscreenPhoto.url}
              alt={fullscreenPhoto.name}
              className="max-w-[90%] max-h-[75vh] rounded-2xl object-contain shadow-2xl"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
