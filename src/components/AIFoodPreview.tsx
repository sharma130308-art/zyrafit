import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowLeft, Sparkles, Check } from "lucide-react";
import type { AIFoodItem } from "@/lib/food-ai";
import type { MealType } from "@/lib/food-store";
import { MEAL_LABELS } from "@/lib/food-store";

interface AIFoodPreviewProps {
  items: AIFoodItem[];
  imageUrl: string;
  onAdd: (foods: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    mealType: MealType;
    source: "ai";
  }[]) => void;
  onBack: () => void;
}

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const confidenceColors: Record<string, string> = {
  high: "text-green-600 bg-green-500/10",
  medium: "text-yellow-600 bg-yellow-500/10",
  low: "text-red-500 bg-red-500/10",
};

export function AIFoodPreview({ items, imageUrl, onAdd, onBack }: AIFoodPreviewProps) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(items.map((_, i) => i)));
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [adding, setAdding] = useState(false);

  const toggleItem = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectedItems = items.filter((_, i) => selected.has(i));
  const totals = selectedItems.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAdd = async () => {
    if (selectedItems.length === 0) return;
    setAdding(true);
    await onAdd(
      selectedItems.map((item) => ({
        name: item.name,
        calories: Math.round(item.calories),
        protein: Math.round(item.protein * 10) / 10,
        carbs: Math.round(item.carbs * 10) / 10,
        fat: Math.round(item.fat * 10) / 10,
        quantity: 1,
        mealType,
        source: "ai" as const,
      }))
    );
    setAdding(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">AI Analysis</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Photo preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl overflow-hidden mb-5 border border-border/40 shadow-sm">
          <img src={imageUrl} alt="Food photo" className="w-full h-48 object-cover" />
        </motion.div>

        {/* Detected items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-3">
            Detected Items ({items.length})
          </label>

          <div className="space-y-2 mb-5">
            {items.map((item, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleItem(i)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                  selected.has(i)
                    ? "bg-primary/5 border-primary/30"
                    : "bg-muted/30 border-border/20 opacity-50"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  selected.has(i) ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
                }`}>
                  {selected.has(i) && <Check className="w-3.5 h-3.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-card-foreground truncate">{item.name}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${confidenceColors[item.confidence]}`}>
                      {item.confidence}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {Math.round(item.calories)} cal · P {Math.round(item.protein)}g · C {Math.round(item.carbs)}g · F {Math.round(item.fat)}g
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Totals */}
        {selectedItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-card border border-border/40 shadow-sm p-5 mb-5">
            <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-4">Total</label>
            <div className="text-center mb-4">
              <motion.span key={totals.calories} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-4xl font-extrabold text-calories">
                {Math.round(totals.calories)}
              </motion.span>
              <p className="text-sm text-muted-foreground">calories</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-protein/8">
                <span className="text-lg font-bold text-protein">{Math.round(totals.protein)}g</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Protein</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-carbs/8">
                <span className="text-lg font-bold text-carbs">{Math.round(totals.carbs)}g</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Carbs</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-fat/8">
                <span className="text-lg font-bold text-fat">{Math.round(totals.fat)}g</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Fat</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Meal selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-5">
          <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-2">Meal</label>
          <div className="grid grid-cols-4 gap-2">
            {mealTypes.map((type) => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMealType(type)}
                className={`px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all ${
                  mealType === type
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/60 text-muted-foreground border border-border/30"
                }`}
              >
                {MEAL_LABELS[type]}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Add button */}
      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={adding || selectedItems.length === 0}
          onClick={handleAdd}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-60"
        >
          <Plus className="w-5 h-5" />
          {adding ? "Adding..." : `Add ${selectedItems.length} item${selectedItems.length !== 1 ? "s" : ""} (${Math.round(totals.calories)} cal)`}
        </motion.button>
      </div>
    </motion.div>
  );
}
