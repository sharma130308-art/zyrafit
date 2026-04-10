import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import type { MealType } from "@/lib/food-store";
import { MEAL_LABELS } from "@/lib/food-store";

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
}

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function AddFoodDialog({ open, onClose, onAdd }: AddFoodDialogProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setQuantity("1");
    setMealType("breakfast");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories || saving) return;
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
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="px-6 pb-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-card-foreground">Add Food</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-muted/60 text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Food Name</label>
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
                    <label className="text-[13px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Calories</label>
                    <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="0" min="0" className={inputClass} required />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Qty</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[13px] font-medium text-protein mb-1.5 block uppercase tracking-wide">Protein</label>
                    <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0g" min="0" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-carbs mb-1.5 block uppercase tracking-wide">Carbs</label>
                    <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0g" min="0" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-fat mb-1.5 block uppercase tracking-wide">Fat</label>
                    <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0g" min="0" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Meal</label>
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
            </div>
            <div className="h-8" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
