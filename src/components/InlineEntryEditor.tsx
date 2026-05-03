import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, Check, X } from "lucide-react";
import type { FoodEntry, MealType } from "@/lib/food-store";
import { MEAL_LABELS, MEAL_ICONS } from "@/lib/food-store";
import { hapticLight, hapticMedium } from "@/lib/haptics";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

interface Props {
  entry: FoodEntry;
  onSave: (id: string, patch: Partial<Omit<FoodEntry, "id">>) => void | Promise<void>;
  onCancel: () => void;
}

export function InlineEntryEditor({ entry, onSave, onCancel }: Props) {
  const [quantity, setQuantity] = useState(entry.quantity);
  const [calories, setCalories] = useState(entry.calories);
  const [protein, setProtein] = useState(entry.protein);
  const [carbs, setCarbs] = useState(entry.carbs);
  const [fat, setFat] = useState(entry.fat);
  const [mealType, setMealType] = useState<MealType>(entry.mealType);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setQuantity(entry.quantity);
    setCalories(entry.calories);
    setProtein(entry.protein);
    setCarbs(entry.carbs);
    setFat(entry.fat);
    setMealType(entry.mealType);
  }, [entry.id]);

  const stepQty = (delta: number) => {
    hapticLight();
    setQuantity((q) => Math.max(0.25, +(q + delta).toFixed(2)));
  };

  const handleSave = async () => {
    setSaving(true);
    hapticMedium();
    await onSave(entry.id, { quantity, calories, protein, carbs, fat, mealType });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mt-1 mb-1 px-3 py-3 rounded-xl bg-muted/30 border border-border/40 space-y-3">
        {/* Live total */}
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total</span>
          <span className="text-[18px] font-bold text-primary tabular-nums">
            {Math.round(calories * quantity)}
            <span className="text-[11px] font-medium text-muted-foreground ml-1">cal</span>
          </span>
        </div>

        {/* Meal pills */}
        <div className="grid grid-cols-4 gap-1.5">
          {MEAL_TYPES.map((m) => (
            <button
              key={m}
              onClick={() => { hapticLight(); setMealType(m); }}
              className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                mealType === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-transparent"
              }`}
            >
              <span className="block text-sm leading-none mb-0.5">{MEAL_ICONS[m]}</span>
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Servings stepper */}
        <div className="flex items-center justify-between bg-card rounded-xl p-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => stepQty(-0.5)}
            className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center"
          >
            <Minus className="w-3.5 h-3.5 text-card-foreground" />
          </motion.button>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Servings</p>
            <span className="text-[16px] font-bold text-card-foreground tabular-nums">
              ×{quantity % 1 === 0 ? quantity : quantity.toFixed(2)}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => stepQty(0.5)}
            className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5 text-card-foreground" />
          </motion.button>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-4 gap-1.5">
          <MacroField label="Cal" value={calories} onChange={setCalories} />
          <MacroField label="P" value={protein} onChange={setProtein} />
          <MacroField label="C" value={carbs} onChange={setCarbs} />
          <MacroField label="F" value={fat} onChange={setFat} />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl bg-card text-card-foreground font-semibold text-[13px] flex items-center justify-center gap-1.5 border border-border/40"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-[13px] flex items-center justify-center gap-1.5 shadow shadow-primary/20 disabled:opacity-60"
          >
            <Check className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function MacroField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="flex flex-col gap-0.5 p-2 bg-card rounded-lg border border-transparent focus-within:border-primary/40 transition-colors">
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value === 0 ? "" : value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? 0 : Math.max(0, parseFloat(v) || 0));
        }}
        className="bg-transparent outline-none font-semibold text-card-foreground tabular-nums text-[14px] w-full"
        placeholder="0"
      />
    </label>
  );
}
