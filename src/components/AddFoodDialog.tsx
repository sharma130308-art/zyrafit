import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { hapticSuccess } from "@/lib/haptics";
import { X, Plus, Search, Clock, ChevronRight, ScanBarcode, Sparkles } from "lucide-react";
import type { MealType, FoodTemplate } from "@/lib/food-store";
import { MEAL_LABELS, searchFoodHistory } from "@/lib/food-store";

interface AddFoodDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    mealType: MealType;
  }) => void;
  onScanClick?: () => void;
  onAiClick?: () => void;
  initialMealType?: MealType;
}

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function AddFoodDialog({ open, onClose, onAdd, onScanClick, onAiClick, initialMealType }: AddFoodDialogProps) {
  const [mode, setMode] = useState<"history" | "manual">("history");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [saving, setSaving] = useState(false);

  // Sync initial meal type when dialog opens
  useEffect(() => {
    if (open && initialMealType) {
      setMealType(initialMealType);
    }
  }, [open, initialMealType]);

  // History search
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<FoodTemplate[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async (q: string) => {
    setLoadingHistory(true);
    const results = await searchFoodHistory(q);
    setHistory(results);
    setLoadingHistory(false);
  }, []);

  // Load history when dialog opens or search changes
  useEffect(() => {
    if (open && mode === "history") {
      const timeout = setTimeout(() => loadHistory(searchQuery), 150);
      return () => clearTimeout(timeout);
    }
  }, [open, searchQuery, mode, loadHistory]);

  const resetForm = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setQuantity("1");
    setMealType("breakfast");
    setSearchQuery("");
    setMode("history");
  };

  const handleSelectFromHistory = (food: FoodTemplate) => {
    setName(food.name);
    setCalories(String(food.calories));
    setProtein(String(food.protein));
    setCarbs(String(food.carbs));
    setFat(String(food.fat));
    setQuantity("1");
    setMode("manual");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories || saving) return;
    hapticSuccess();
    setSaving(true);
    await onAdd({
      name,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      quantity: parseInt(quantity, 10) || 1,
      mealType,
    });
    setSaving(false);
    resetForm();
    onClose();
  };

  const inputClass =
    "w-full px-4 py-3.5 rounded-2xl bg-muted/60 text-foreground placeholder:text-muted-foreground/50 border border-border/30 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-[15px]";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-foreground/15 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.08)] max-h-[92vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="px-6 pb-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-card-foreground">Add Food</h2>
                <div className="flex items-center gap-2">
                  {onAiClick && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { resetForm(); onClose(); onAiClick(); }}
                      className="p-2 rounded-full bg-primary/10 text-primary"
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.button>
                  )}
                  {onScanClick && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { resetForm(); onClose(); onScanClick(); }}
                      className="p-2 rounded-full bg-primary/10 text-primary"
                    >
                      <ScanBarcode className="w-5 h-5" />
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { resetForm(); onClose(); }}
                    className="p-2 rounded-full bg-muted/60 text-muted-foreground"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl mb-4">
                <button
                  onClick={() => setMode("history")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                    mode === "history"
                      ? "bg-card text-card-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Recent
                </button>
                <button
                  onClick={() => setMode("manual")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                    mode === "manual"
                      ? "bg-card text-card-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Manual
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === "history" ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Search input */}
                    <div className="relative mb-3">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search past foods..."
                        className={`${inputClass} pl-11`}
                        autoFocus
                      />
                    </div>

                    {/* Results */}
                    <div className="space-y-1 max-h-[45vh] overflow-y-auto -mx-2 px-2">
                      {loadingHistory ? (
                        <div className="flex justify-center py-8">
                          <motion.div
                            className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      ) : history.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground/60 text-sm">
                            {searchQuery ? "No matching foods found" : "No food history yet"}
                          </p>
                          <button
                            onClick={() => setMode("manual")}
                            className="mt-2 text-sm text-primary font-medium"
                          >
                            Add manually →
                          </button>
                        </div>
                      ) : (
                        history.map((food, i) => (
                          <motion.button
                            key={`${food.name}-${i}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectFromHistory(food)}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 hover:bg-muted/60 border border-border/20 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-card-foreground truncate">
                                {food.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {food.calories} cal
                                <span className="mx-1">·</span>
                                P {food.protein}g
                                <span className="mx-1">·</span>
                                C {food.carbs}g
                                <span className="mx-1">·</span>
                                F {food.fat}g
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-2 flex-shrink-0" />
                          </motion.button>
                        ))
                      )}
                    </div>

                    {/* Manual entry CTA */}
                    {history.length > 0 && (
                      <button
                        onClick={() => setMode("manual")}
                        className="w-full mt-3 py-3 text-sm text-primary font-medium"
                      >
                        Or add a new food manually
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="manual"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                  >
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="text-[13px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                          Food Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Grilled Chicken"
                          className={inputClass}
                          required
                          autoFocus
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[13px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                            Calories
                          </label>
                          <input
                            type="number"
                            value={calories}
                            onChange={(e) => setCalories(e.target.value)}
                            placeholder="0"
                            min="0"
                            className={inputClass}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[13px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                            Qty
                          </label>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[13px] font-medium text-protein mb-1.5 block uppercase tracking-wide">
                            Protein
                          </label>
                          <input
                            type="number"
                            value={protein}
                            onChange={(e) => setProtein(e.target.value)}
                            placeholder="0g"
                            min="0"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="text-[13px] font-medium text-carbs mb-1.5 block uppercase tracking-wide">
                            Carbs
                          </label>
                          <input
                            type="number"
                            value={carbs}
                            onChange={(e) => setCarbs(e.target.value)}
                            placeholder="0g"
                            min="0"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="text-[13px] font-medium text-fat mb-1.5 block uppercase tracking-wide">
                            Fat
                          </label>
                          <input
                            type="number"
                            value={fat}
                            onChange={(e) => setFat(e.target.value)}
                            placeholder="0g"
                            min="0"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[13px] font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                          Meal
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {mealTypes.map((type) => (
                            <motion.button
                              key={type}
                              type="button"
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
                      </div>

                      <motion.button
                        type="submit"
                        disabled={saving}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:shadow-primary/15 transition-shadow disabled:opacity-60"
                      >
                        <Plus className="w-5 h-5" />
                        {saving ? "Saving..." : "Add Food"}
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
