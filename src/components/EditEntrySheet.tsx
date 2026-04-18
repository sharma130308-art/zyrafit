import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, Check } from "lucide-react";
import type { FoodEntry, MealType } from "@/lib/food-store";
import { MEAL_LABELS, MEAL_ICONS } from "@/lib/food-store";
import { hapticLight, hapticMedium } from "@/lib/haptics";

interface EditEntrySheetProps {
  entry: FoodEntry | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Omit<FoodEntry, "id">>) => void | Promise<void>;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function EditEntrySheet({ entry, onClose, onSave }: EditEntrySheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setQuantity(entry.quantity);
      setCalories(entry.calories);
      setProtein(entry.protein);
      setCarbs(entry.carbs);
      setFat(entry.fat);
      setMealType(entry.mealType);
    }
  }, [entry]);

  const stepQty = (delta: number) => {
    hapticLight();
    setQuantity((q) => Math.max(0.25, +(q + delta).toFixed(2)));
  };

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    hapticMedium();
    await onSave(entry.id, {
      quantity,
      calories,
      protein,
      carbs,
      fat,
      mealType,
    });
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {entry && (
        <>
          <motion.div
            className="fixed inset-0 z-[55] bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[56] bg-card rounded-t-3xl shadow-2xl border-t border-border/40 max-h-[90vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Edit meal
                </p>
                <h2 className="text-[17px] font-semibold text-card-foreground truncate">
                  {entry.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0 ml-3"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Live totals preview */}
            <div className="mx-5 mb-4 rounded-2xl bg-primary/5 border border-primary/15 p-3.5 flex items-baseline justify-between">
              <span className="text-[12px] font-medium text-muted-foreground">Total</span>
              <span className="text-[22px] font-bold text-primary tabular-nums">
                {Math.round(calories * quantity)}
                <span className="text-[12px] font-medium text-muted-foreground ml-1">cal</span>
              </span>
            </div>

            {/* Meal type pills */}
            <div className="px-5 mb-4">
              <p className="text-[12px] font-medium text-muted-foreground mb-2">Meal</p>
              <div className="grid grid-cols-4 gap-1.5">
                {MEAL_TYPES.map((m) => (
                  <button
                    key={m}
                    onClick={() => { hapticLight(); setMealType(m); }}
                    className={`py-2 rounded-xl text-[11px] font-semibold border transition-colors ${
                      mealType === m
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-transparent"
                    }`}
                  >
                    <span className="block text-base leading-none mb-1">{MEAL_ICONS[m]}</span>
                    {MEAL_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity stepper */}
            <div className="px-5 mb-4">
              <p className="text-[12px] font-medium text-muted-foreground mb-2">Servings</p>
              <div className="flex items-center justify-between bg-muted/40 rounded-2xl p-1.5">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => stepQty(-0.5)}
                  className="w-11 h-11 rounded-xl bg-card shadow-sm flex items-center justify-center"
                >
                  <Minus className="w-4 h-4 text-card-foreground" />
                </motion.button>
                <span className="text-[20px] font-bold text-card-foreground tabular-nums">
                  ×{quantity % 1 === 0 ? quantity : quantity.toFixed(2)}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => stepQty(0.5)}
                  className="w-11 h-11 rounded-xl bg-card shadow-sm flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 text-card-foreground" />
                </motion.button>
              </div>
            </div>

            {/* Per-serving macros */}
            <div className="px-5 mb-3">
              <p className="text-[12px] font-medium text-muted-foreground mb-2">Per serving</p>
              <div className="space-y-2">
                <MacroInput label="Calories" value={calories} onChange={setCalories} unit="cal" />
                <div className="grid grid-cols-3 gap-2">
                  <MacroInput label="Protein" value={protein} onChange={setProtein} unit="g" compact />
                  <MacroInput label="Carbs" value={carbs} onChange={setCarbs} unit="g" compact />
                  <MacroInput label="Fat" value={fat} onChange={setFat} unit="g" compact />
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)]">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="w-full h-13 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                {saving ? "Saving…" : "Save changes"}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface MacroInputProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit: string;
  compact?: boolean;
}

function MacroInput({ label, value, onChange, unit, compact }: MacroInputProps) {
  return (
    <label
      className={`flex ${compact ? "flex-col gap-0.5 p-2.5" : "items-center justify-between px-3.5 py-2.5"} bg-muted/40 rounded-xl border border-transparent focus-within:border-primary/40 focus-within:bg-card transition-colors`}
    >
      <span className={`text-[11px] font-medium text-muted-foreground ${compact ? "" : ""}`}>
        {label}
      </span>
      <div className={`flex items-baseline gap-1 ${compact ? "" : ""}`}>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={value === 0 ? "" : value}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? 0 : Math.max(0, parseFloat(v) || 0));
          }}
          className={`bg-transparent outline-none font-semibold text-card-foreground tabular-nums ${
            compact ? "text-[16px] w-full" : "text-[16px] w-20 text-right"
          }`}
          placeholder="0"
        />
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </div>
    </label>
  );
}
